

// Globala variabler för chatten
let hasShownWelcome = false;
const chatSessionId = 'session-' + Date.now();


// Initialisera chattbotten när sidan laddas
document.addEventListener('DOMContentLoaded', function() {
    // Hantera Enter-tangenten i chatfältet
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                sendChatMessage();
            }
        });
       
        // Autofokus på inputfältet när chatten öppnas
        document.querySelector('.chat-bubble').addEventListener('click', function() {
            setTimeout(() => {
                chatInput.focus();
            }, 300);
        });
    }
   
    // Hantera reset-knappen
    const resetButton = document.getElementById('reset-chat');
    if (resetButton) {
        resetButton.addEventListener('click', resetConversation);
    }
   
    // Lägg till dynamiska effekter
    addChatEffects();
});


// Lägger till interaktiva effekter för chatten
function addChatEffects() {
    // Lägg till hover-effekt för meddelanden
    document.addEventListener('mouseover', function(e) {
        if (e.target.classList.contains('message') || e.target.closest('.message')) {
            const message = e.target.classList.contains('message') ? e.target : e.target.closest('.message');
            message.style.transform = 'translateY(-2px)';
        }
    });
   
    document.addEventListener('mouseout', function(e) {
        if (e.target.classList.contains('message') || e.target.closest('.message')) {
            const message = e.target.classList.contains('message') ? e.target : e.target.closest('.message');
            message.style.transform = 'translateY(0)';
        }
    });
}


// Växla chattfönstret med animation
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    const chatBubble = document.querySelector('.chat-bubble');
   
    if (chatWindow) {
        if (!chatWindow.classList.contains('active')) {
            // Öppna chatten
            chatWindow.classList.add('active');
            chatBubble.style.opacity = '0';
           
            if (!hasShownWelcome) {
                showWelcomeMessage();
            }
           
            // Fokusera på input efter animation
            setTimeout(() => {
                const chatInput = document.getElementById('chatInput');
                if (chatInput) chatInput.focus();
            }, 300);
        } else {
            // Stäng chatten
            chatWindow.style.transform = 'translateY(20px)';
            chatWindow.style.opacity = '0';
           
            setTimeout(() => {
                chatWindow.classList.remove('active');
                chatWindow.style.transform = '';
                chatWindow.style.opacity = '';
                chatBubble.style.opacity = '1';
            }, 300);
        }
    }
}


// Hämta välkomstmeddelandet
async function showWelcomeMessage() {
    if (!hasShownWelcome) {
        try {
            const typingIndicator = document.getElementById('typingIndicator');
           
            // Visa skriv-indikatorn
            if (typingIndicator) {
                typingIndicator.classList.add('visible');
            }
           
            // Förbered profildata och tripsdata om det finns
            const payload = {
                session_id: chatSessionId,
                message: ''
            };
           
            // Försök hämta användardata om tillgängligt
            const profileInfo = getUserProfile();
            if (profileInfo) {
                payload.profile_info = profileInfo;
            }
           
            const savedTrips = getSavedTrips();
            if (savedTrips) {
                payload.saved_trips = savedTrips;
            }
           
            const response = await fetch('http://localhost:5001/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });


            // Dölj skriv-indikatorn med fördröjning för naturlig känsla
            setTimeout(() => {
                if (typingIndicator) {
                    typingIndicator.classList.remove('visible');
                }
            }, 500);


            if (response.ok) {
                const data = await response.json();
                if (data.is_welcome) {
                    // Lägg till liten fördröjning för mer naturlig interaktion
                    setTimeout(() => {
                        addChatMessage(data.response, 'bot-message');
                        hasShownWelcome = true;
                    }, 800);
                }
            }
        } catch (error) {
            console.error('Kunde inte visa välkomstmeddelande:', error);
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.classList.remove('visible');
            }
        }
    }
}


// Skicka meddelande till chattbotten med förbättrad UX
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const typingIndicator = document.getElementById('typingIndicator');
    if (!input) return;


    const message = input.value.trim();
    if (!message) return;


    try {
        // Visa användarens meddelande med animation
        addChatMessage(message, 'user-message', true);
        input.value = '';


        // Kort fördröjning innan skrivindikatorn visas (mer naturligt)
        setTimeout(() => {
            // Visa skriv-indikatorn
            if (typingIndicator) {
                typingIndicator.classList.add('visible');
               
                // Scrolla ner för att visa indikatorn
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
        }, 300);


        // Förbered payload med profil och resor om tillgängligt
        const payload = {
            message: message,
            session_id: chatSessionId
        };
       
        // Försök hämta användardata om tillgängligt
        const profileInfo = getUserProfile();
        if (profileInfo) {
            payload.profile_info = profileInfo;
        }
       
        const savedTrips = getSavedTrips();
        if (savedTrips) {
            payload.saved_trips = savedTrips;
        }


        const response = await fetch('http://localhost:5001/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });


        // Håll skrivindikatorn synlig en kort stund efter svaret kommit (mer naturligt)
        setTimeout(() => {
            if (typingIndicator) {
                typingIndicator.classList.remove('visible');
            }
           
            if (response.ok) {
                const data = response.json();
                data.then(result => {
                    if (!result.is_welcome) {
                        // Kort fördröjning innan svaret visas
                        setTimeout(() => {
                            addChatMessage(result.response, 'bot-message', true);
                        }, 400);
                    }
                });
            } else {
                throw new Error('API-anropet misslyckades');
            }
        }, 800);


    } catch (error) {
        // Dölj skriv-indikatorn vid fel
        if (typingIndicator) {
            typingIndicator.classList.remove('visible');
        }
        console.error('Fel:', error);
        addChatMessage('Tyvärr kunde jag inte behandla ditt meddelande just nu.', 'bot-message');
    }
}


// Lägg till meddelande i chatthistoriken med animationseffekt
function addChatMessage(message, className, animate = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;


    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
   
    if (animate) {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
    }
   
    // Formatera meddelandet (förbättrad Markdown)
    let formattedMessage = message
        // Konvertera fetstil
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Konvertera kursiv
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Konvertera punktlistor (med bättre spacing)
        .replace(/^(\s*[•*-]\s+)(.*)/gm, '<li style="margin-bottom:8px">$2</li>')
        // Konvertera numrerade listor (med bättre spacing)
        .replace(/^(\s*\d+\.\s+)(.*)/gm, '<li style="margin-bottom:8px">$1$2</li>');
       
    // Omslut punktlistor med styling
    if (formattedMessage.includes('<li')) {
        formattedMessage = formattedMessage.replace(
            /<li.*?<\/li>/gs,
            '<ul style="margin:10px 0;padding-left:20px;color:#333">$&</ul>'
        );
    }
   
    // Konvertera länkar
    formattedMessage = formattedMessage.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" style="color:#1677ff;text-decoration:underline">$1</a>'
    );
   
    // Konvertera radbrytningar
    formattedMessage = formattedMessage.replace(/\n\n/g, '<br><br>');
    formattedMessage = formattedMessage.replace(/\n/g, '<br>');
   
    messageDiv.innerHTML = formattedMessage;


    // Lägg till tidsstämpel
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
    });
    messageDiv.appendChild(timeDiv);


    chatMessages.appendChild(messageDiv);
   
    // Animera meddelandet om det behövs
    if (animate) {
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);
    }
   
    // Scrolla till botten med smooth scrolling
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
}


// Funktion för att återställa konversationen med animation
async function resetConversation() {
    try {
        // Visuell feedback att återställning pågår
        const resetButton = document.getElementById('reset-chat');
        if (resetButton) {
            resetButton.innerText = "Återställer...";
            resetButton.disabled = true;
        }
       
        const response = await fetch('http://localhost:5001/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: chatSessionId
            })
        });


        if (response.ok) {
            // Rensa chatten med fadeout animation
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) {
                const messages = chatMessages.querySelectorAll('.message');
               
                // Fade out alla meddelanden
                messages.forEach((msg, index) => {
                    setTimeout(() => {
                        msg.style.transition = 'all 0.3s ease';
                        msg.style.opacity = '0';
                        msg.style.transform = 'translateY(20px)';
                    }, index * 50);
                });
               
                // Ta bort meddelanden efter animation och visa välkomstmeddelande
                setTimeout(() => {
                    chatMessages.innerHTML = '';
                    hasShownWelcome = false;
                    showWelcomeMessage();
                   
                    // Återställ reset-knappen
                    if (resetButton) {
                        resetButton.innerText = "Ny konversation";
                        resetButton.disabled = false;
                    }
                }, messages.length * 50 + 300);
            }
        }
    } catch (error) {
        console.error('Kunde inte återställa konversationen:', error);
       
        // Återställ reset-knappen vid fel
        const resetButton = document.getElementById('reset-chat');
        if (resetButton) {
            resetButton.innerText = "Ny konversation";
            resetButton.disabled = false;
        }
    }
}


// Funktion för att hämta användarens profil från localStorage
function getUserProfile() {
    try {
        const travelProfileStr = localStorage.getItem('travelProfile');
        const personalInfoStr = localStorage.getItem('personalInfo');
       
        // Kontrollera att det finns giltig data
        if (!travelProfileStr && !personalInfoStr) {
            return null;
        }
       
        const travelProfile = travelProfileStr ? JSON.parse(travelProfileStr) : {};
        const personalInfo = personalInfoStr ? JSON.parse(personalInfoStr) : {};
       
        // Kombinera relevant information
        return {
            name: personalInfo.name || '',
            age: personalInfo.age || '',
            travelExperience: travelProfile.travelExperience || '',
            travelStyle: travelProfile.travelStyle || '',
            interests: (travelProfile.interests && typeof travelProfile.interests === 'object')
                ? travelProfile.interests
                : {},
            specialRequirements: travelProfile.specialRequirements || '',
            languages: Array.isArray(travelProfile.languages) ? travelProfile.languages : []
        };
    } catch (error) {
        console.error('Fel vid hämtning av användarprofil:', error);
        return null;
    }
}


// Funktion för att hämta sparade resor från localStorage
function getSavedTrips() {
    try {
        const savedTripsStr = localStorage.getItem('savedTrips');
        if (!savedTripsStr) {
            return null;
        }
       
        const savedTrips = JSON.parse(savedTripsStr);
        if (!Array.isArray(savedTrips)) {
            return null;
        }
       
        return savedTrips;
    } catch (error) {
        console.error('Fel vid hämtning av sparade resor:', error);
        return null;
    }
   
}

