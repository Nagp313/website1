from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json


app = Flask(__name__)
CORS(app)


API_KEY = "Zxc7fGdHwrTjXRnEPEpimT7eMne5zdvFhcbfhQ7r83562080"
API_URL = "https://teachgpt.ssis.nu/api/v1/chat/completions"


conversations = {}


# Utökad systemmeddelande med information om reseplaneringsverktyget
SYSTEM_MESSAGE = """Du är TravelBuddy, en vänlig och kunnig AI-reseplanerare.
När du svarar, följ dessa riktlinjer för tydlig formattering:


1. Dela upp långa svar i kortare stycken
2. Använd punktlistor för uppräkningar
3. Använd fetstil (**) sparsamt och bara för riktigt viktiga nyckelord
4. När du listar platser eller aktiviteter, använd numrerade listor
5. Använd emojis sparsamt för att göra texten mer levande


Till exempel:
"Här är tre rekommenderade platser:


1. Plats A - Kort beskrivning 🏖️
2. Plats B - Kort beskrivning 🏰
3. Plats C - Kort beskrivning 🌅


Praktiska tips:
• Tips 1
• Tips 2
• Tips 3"


Var alltid positiv och entusiastisk när du pratar om resor.
Ge specifika och praktiska råd. När du föreslår resmål, förklara varför de skulle passa användaren.


KUNSKAP OM RESEPLANERAREN:
TravelBuddy webbplatsen har en reseplanerare med följande funktioner:
- Användare kan lägga till resor med destinationer, datum, och budget
- Varje destination kan ha flera transportsätt (flyg, tåg, bil, buss, båt)
- Användare kan lägga till boende för varje destination (hotell, lägenhet, villa, vandrarhem)
- Aktiviteter kan läggas till med kategori, datum, tid och kostnad
- Planeraren stödjer även försäkringsinformation
- Alla resor sparas i användarens profil
- Användaren kan exportera resedetaljer till en textfil
- Användaren kan redigera eller ta bort sparade resor


När användare frågar om hur de kan planera sin resa, hänvisa dem till reseplaneringsverktyget och förklara hur det kan hjälpa dem organisera transporter, boende och aktiviteter. Om de har specifika frågor om funktioner, guida dem till relevant del av verktyget."""


WELCOME_MESSAGE = """Hej! Jag är TravelBuddy, din personliga reseplanerare! 👋✈️


Jag kan hjälpa dig med:
• Reseinspiration och förslag på destinationer
• Reseplanering och praktiska tips
• Budgetråd och kostnadsuppskattningar
• Lokala tips om sevärdheter och aktiviteter
• Packlistor och reserekommendationer


Du kan också använda vår **reseplanerare** för att skapa detaljerade resplaner med destinationer, boende, aktiviteter och mer!


Vart drömmer du om att resa? Berätta mer så hjälper jag dig planera din perfekta resa! 🌎"""


# Funktion för att extrahera användarens reseprofil om den finns tillgänglig
def get_user_profile(session_id):
    try:
        # Hämta användarprofilinformation från localStorage via frontend
        # Detta skulle kräva att frontend skickar denna information i förfrågan
        profile_info = request.json.get('profile_info', None)
        if profile_info:
            return profile_info
        return None
    except Exception as e:
        print(f"Fel vid hämtning av användarprofil: {str(e)}")
        return None


@app.route('/chat', methods=['POST'])
def chat():
    try:
        print("Fick meddelande från frontend:", request.json)
        user_message = request.json.get('message', '')
        session_id = request.json.get('session_id', 'default')
       
        # Hantera första meddelandet
        if session_id not in conversations:
            conversations[session_id] = [
                {
                    "role": "system",
                    "content": SYSTEM_MESSAGE
                }
            ]
            return jsonify({
                'response': WELCOME_MESSAGE,
                'is_welcome': True
            })
           
        # Om användarens meddelande är tomt, returnera bara välkomstmeddelandet
        if not user_message.strip():
            return jsonify({
                'response': WELCOME_MESSAGE,
                'is_welcome': True
            })
           
        # Anpassa användarmeddelandet med profilkontext endast om relevant
        profile_context = ""
        try:
            # Försök hämta reseprofilinformation om det finns
            profile_info = request.json.get('profile_info')
            if profile_info and isinstance(profile_info, dict):
                # Bygger enkel profilkontext med säker felhantering
                profile_parts = []
                if profile_info.get('travelExperience'):
                    profile_parts.append(f"Resvana: {profile_info.get('travelExperience')}")
                if profile_info.get('travelStyle'):
                    profile_parts.append(f"Resestil: {profile_info.get('travelStyle')}")
                if profile_parts:
                    profile_context = "Min reseprofil: " + ", ".join(profile_parts)
        except Exception as e:
            print(f"Fel vid hantering av profil: {str(e)}")
           
        # Hantera sparade resor
        trips_context = ""
        try:
            # Hämta information om sparade resor om tillgängligt och relevant
            saved_trips = request.json.get('saved_trips')
            if saved_trips and isinstance(saved_trips, list) and len(saved_trips) > 0:
                if "tidigare" in user_message.lower() or "sparad" in user_message.lower() or "mina resor" in user_message.lower():
                    destinations = []
                    for trip in saved_trips:
                        if isinstance(trip, dict) and 'destinations' in trip:
                            for dest in trip.get('destinations', []):
                                if isinstance(dest, dict) and dest.get('name'):
                                    destinations.append(dest.get('name'))
                   
                    if destinations:
                        dest_list = ", ".join(destinations[:5])
                        if len(destinations) > 5:
                            dest_list += f" och {len(destinations) - 5} till"
                        trips_context = f"Jag har {len(saved_trips)} sparade resor till {dest_list}."
        except Exception as e:
            print(f"Fel vid hantering av sparade resor: {str(e)}")
           
        # Lägg till kontext till användarens meddelande om det finns
        enhanced_message = user_message
        if profile_context and "profil" in user_message.lower():
            enhanced_message += f"\n\n{profile_context}"
        if trips_context:
            enhanced_message += f"\n\n{trips_context}"
       
        conversations[session_id].append({
            "role": "user",
            "content": enhanced_message
        })
       
        response = requests.post(
            API_URL,
            headers={
                'Authorization': f'Bearer {API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                "model": "Meta-Llama-3.3-70B-Instruct-AWQ",
                "messages": conversations[session_id]
            }
        )
       
        if response.status_code == 200:
            bot_reply = response.json()['choices'][0]['message']['content']
            conversations[session_id].append({
                "role": "assistant",
                "content": bot_reply
            })
           
            return jsonify({
                'response': bot_reply,
                'is_welcome': False
            })
        else:
            return jsonify({'error': str(response.text)}), response.status_code
           
    except Exception as e:
        print(f"Fel: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/reset', methods=['POST'])
def reset_conversation():
    try:
        session_id = request.json.get('session_id', 'default')
        if session_id in conversations:
            del conversations[session_id]
        return jsonify({'status': 'success', 'message': 'Konversation återställd'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("Startar server...")
    print(f"API_KEY är {'INTE SATT' if API_KEY == 'din-api-nyckel-här' else 'satt'}")
    app.run(debug=True, port=5001)
else:
    # Detta används av Gunicorn i produktion
    application = app

