/**
 * Clean JARVIS AI Assistant
 * Focus on working microphone and speech synthesis
 */

class JARVIS {
    constructor() {
        // Core state
        this.isListening = false;
        this.isSpeaking = false;
        this.microphoneEnabled = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentTimer = null;
        
        // Essential data
        this.websites = {
            'youtube': 'https://www.youtube.com',
            'gmail': 'https://mail.google.com', 
            'google': 'https://www.google.com',
            'facebook': 'https://www.facebook.com',
            'instagram': 'https://www.instagram.com',
            'netflix': 'https://www.netflix.com',
            'amazon': 'https://www.amazon.com'
        };
        
        this.jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "I told my computer a joke about UDP... but I'm not sure if it got it.",
            "Why do programmers prefer dark mode? Because light attracts bugs!",
            "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
            "Why did the robot go to therapy? It had too many bytes of emotional baggage!"
        ];
        
        this.init();
    }
    
    async init() {
        console.log('🤖 Initializing JARVIS...');
        
        try {
            await this.waitForDOM();
            this.cacheElements();
            this.setupEventListeners();
            await this.setupSpeechSynthesis();
            this.displayWelcomeMessage();
            
            console.log('✅ JARVIS ready!');
        } catch (error) {
            console.error('❌ JARVIS initialization failed:', error);
        }
    }
    
    waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    cacheElements() {
        this.elements = {
            chatMessages: document.getElementById('chat-messages'),
            micBtn: document.getElementById('mic-btn'),
            micIcon: document.getElementById('mic-icon'),
            textInput: document.getElementById('text-input'),
            sendBtn: document.getElementById('send-btn'),
            status: document.getElementById('status'),
            statusText: document.querySelector('.status-text'),
            permissionModal: document.getElementById('permission-modal'),
            enableMicBtn: document.getElementById('enable-mic'),
            skipMicBtn: document.getElementById('skip-mic'),
            timerOverlay: document.getElementById('timer-overlay'),
            timerTime: document.getElementById('timer-time'),
            timerCancel: document.getElementById('timer-cancel')
        };
        
        console.log('📱 Elements cached:', Object.keys(this.elements).length);
    }
    
    setupEventListeners() {
        console.log('📡 Setting up event listeners...');
        
        // Microphone button
        if (this.elements.micBtn) {
            this.elements.micBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Microphone button clicked');
                this.toggleVoiceInput();
            });
        }
        
        // Send button  
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Send button clicked');
                this.sendMessage();
            });
        }
        
        // Text input
        if (this.elements.textInput) {
            this.elements.textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('Enter key pressed');
                    this.sendMessage();
                }
            });
            
            this.elements.textInput.addEventListener('input', () => this.updateSendButton());
        }
        
        // Permission modal buttons
        if (this.elements.enableMicBtn) {
            this.elements.enableMicBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Enable microphone clicked');
                await this.requestMicrophone();
            });
        }
        
        if (this.elements.skipMicBtn) {
            this.elements.skipMicBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Skip microphone clicked');
                this.hidePermissionModal();
            });
        }
        
        // Modal backdrop click to close
        if (this.elements.permissionModal) {
            const backdrop = this.elements.permissionModal.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) {
                        console.log('Backdrop clicked');
                        this.hidePermissionModal();
                    }
                });
            }
        }
        
        // Timer cancel
        if (this.elements.timerCancel) {
            this.elements.timerCancel.addEventListener('click', () => this.cancelTimer());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                this.toggleVoiceInput();
            }
            if (e.code === 'Escape') {
                this.hidePermissionModal();
            }
        });
        
        // Initialize send button state
        this.updateSendButton();
        
        console.log('📡 Event listeners ready');
    }
    
    async setupSpeechSynthesis() {
        if (!this.synthesis) {
            console.warn('❌ Speech synthesis not supported');
            return;
        }
        
        console.log('🗣️ Setting up speech synthesis...');
        
        // Wait for voices to load
        return new Promise((resolve) => {
            if (this.synthesis.getVoices().length > 0) {
                console.log('✅ Voices already loaded');
                resolve();
            } else {
                this.synthesis.addEventListener('voiceschanged', () => {
                    console.log('✅ Voices loaded');
                    resolve();
                }, { once: true });
                // Fallback timeout
                setTimeout(() => {
                    console.log('⚠️ Voice loading timeout');
                    resolve();
                }, 1000);
            }
        });
    }
    
    showPermissionModal() {
        console.log('Showing permission modal');
        if (this.elements.permissionModal) {
            this.elements.permissionModal.classList.remove('hidden');
        }
    }
    
    hidePermissionModal() {
        console.log('Hiding permission modal');
        if (this.elements.permissionModal) {
            this.elements.permissionModal.classList.add('hidden');
        }
    }
    
    async requestMicrophone() {
        console.log('Requesting microphone access...');
        
        try {
            this.updateStatus('Requesting microphone access...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true 
            });
            
            // Stop the stream immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());
            
            this.microphoneEnabled = true;
            this.initSpeechRecognition();
            this.updateStatus('Microphone enabled - Ready');
            this.hidePermissionModal();
            
            console.log('✅ Microphone access granted');
            return true;
        } catch (error) {
            console.error('❌ Microphone access denied:', error);
            this.updateStatus('Microphone access denied - You can still type messages');
            this.hidePermissionModal();
            return false;
        }
    }
    
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('❌ Speech recognition not supported');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateListeningUI();
            this.updateStatus('Listening...');
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Speech recognized:', transcript);
            if (this.elements.textInput) {
                this.elements.textInput.value = transcript;
                this.updateSendButton();
            }
            this.sendMessage();
        };
        
        this.recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            this.stopListening();
            this.updateStatus('Speech recognition error - Try again');
        };
        
        this.recognition.onend = () => {
            this.stopListening();
        };
        
        console.log('✅ Speech recognition initialized');
    }
    
    toggleVoiceInput() {
        if (!this.microphoneEnabled) {
            console.log('Microphone not enabled, showing permission modal');
            this.showPermissionModal();
            return;
        }
        
        if (!this.recognition) {
            const message = "Voice recognition is not supported in your browser. Please use text input.";
            this.addMessage(message, 'ai');
            this.speak(message);
            return;
        }
        
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    startListening() {
        if (!this.recognition || this.isListening) return;
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('❌ Failed to start listening:', error);
            this.updateStatus('Error starting voice recognition');
        }
    }
    
    stopListening() {
        this.isListening = false;
        this.updateListeningUI();
        this.updateStatus('Ready');
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('❌ Error stopping recognition:', error);
            }
        }
    }
    
    updateListeningUI() {
        if (this.elements.micBtn && this.elements.micIcon) {
            if (this.isListening) {
                this.elements.micBtn.classList.add('listening');
                this.elements.micIcon.textContent = '🔴';
            } else {
                this.elements.micBtn.classList.remove('listening');
                this.elements.micIcon.textContent = '🎤';
            }
        }
    }
    
    updateSendButton() {
        const text = this.elements.textInput?.value.trim() || '';
        if (this.elements.sendBtn) {
            this.elements.sendBtn.disabled = !text;
        }
    }
    
    updateStatus(message) {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = message;
        }
        console.log(`Status: ${message}`);
    }
    
    sendMessage() {
        const message = this.elements.textInput?.value.trim();
        if (!message) {
            console.log('No message to send');
            return;
        }
        
        console.log('Sending message:', message);
        
        // Clear input
        if (this.elements.textInput) {
            this.elements.textInput.value = '';
        }
        this.updateSendButton();
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Process command immediately
        this.processCommand(message);
    }
    
    processCommand(message) {
        console.log('Processing command:', message);
        const cmd = message.toLowerCase().trim();
        
        // Greetings
        if (/^(hello|hi|hey|good morning|good afternoon|good evening)/.test(cmd)) {
            const responses = [
                "Hello! How can I help you today?",
                "Hi there! What can I do for you?", 
                "Hey! I'm ready to assist you.",
                "Greetings! How may I be of service?"
            ];
            const response = this.randomChoice(responses);
            console.log('Greeting detected, responding with:', response);
            this.respond(response);
            return;
        }
        
        // Time
        if (/time/.test(cmd)) {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit'
            });
            const response = `The current time is ${time}.`;
            console.log('Time request, responding with:', response);
            this.respond(response);
            return;
        }
        
        // Date
        if (/date/.test(cmd)) {
            const now = new Date();
            const date = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
            });
            const response = `Today is ${date}.`;
            console.log('Date request, responding with:', response);
            this.respond(response);
            return;
        }
        
        // Timer
        if (/timer|set.*timer/i.test(cmd)) {
            const match = cmd.match(/(\d+)\s*(minute|second|hour)s?/);
            if (match) {
                const amount = parseInt(match[1]);
                const unit = match[2];
                console.log('Timer request:', amount, unit);
                this.setTimer(amount, unit);
                return;
            } else {
                const response = "Please specify a time, like 'set timer for 5 minutes' or 'timer 30 seconds'.";
                console.log('Invalid timer request, responding with:', response);
                this.respond(response);
                return;
            }
        }
        
        // Math
        if (/calculate|what.*is|math/.test(cmd)) {
            const mathMatch = cmd.match(/(\d+)\s*([\+\-\*\/x])\s*(\d+)/);
            if (mathMatch) {
                const num1 = parseFloat(mathMatch[1]);
                let operator = mathMatch[2];
                const num2 = parseFloat(mathMatch[3]);
                
                // Handle 'x' as multiplication
                if (operator === 'x') operator = '*';
                
                let result;
                switch (operator) {
                    case '+': result = num1 + num2; break;
                    case '-': result = num1 - num2; break;
                    case '*': result = num1 * num2; break;
                    case '/': result = num2 !== 0 ? num1 / num2 : 'Cannot divide by zero'; break;
                    default: result = 'Invalid operation';
                }
                
                const response = `${num1} ${operator} ${num2} equals ${result}`;
                console.log('Math calculation, responding with:', response);
                this.respond(response);
                return;
            } else {
                const response = "Please provide a math problem, like 'calculate 25 plus 30' or 'what is 15 times 4'.";
                console.log('Invalid math request, responding with:', response);
                this.respond(response);
                return;
            }
        }
        
        // Jokes
        if (/joke|funny|laugh/.test(cmd)) {
            const joke = this.randomChoice(this.jokes);
            console.log('Joke request, responding with:', joke);
            this.respond(joke);
            return;
        }
        
        // Websites
        if (/open|go to|visit/.test(cmd)) {
            const website = this.extractWebsite(cmd);
            if (website) {
                console.log('Website request:', website);
                this.openWebsite(website);
                return;
            }
        }
        
        // Search
        if (/search|google/.test(cmd)) {
            const searchTerm = cmd.replace(/search for|google|search/gi, '').trim();
            if (searchTerm) {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
                window.open(searchUrl, '_blank');
                const response = `Searching for "${searchTerm}" on Google.`;
                console.log('Search request, responding with:', response);
                this.respond(response);
                return;
            } else {
                const response = "What would you like me to search for?";
                console.log('Invalid search request, responding with:', response);
                this.respond(response);
                return;
            }
        }
        
        // Weather
        if (/weather|temperature/.test(cmd)) {
            const response = "I'd love to check the weather for you! For live weather data, please visit weather.com or your local weather service.";
            console.log('Weather request, responding with:', response);
            this.respond(response);
            return;
        }
        
        // Default response
        const responses = [
            "I'm not sure how to help with that. Try asking me about the time, setting a timer, doing math, telling jokes, or opening websites.",
            "I didn't understand that command. I can help with time, timers, calculations, jokes, website navigation, and searches.",
            "That's beyond my current capabilities. I can assist with basic tasks like timers, calculations, time/date, jokes, and web navigation."
        ];
        const response = this.randomChoice(responses);
        console.log('Default response:', response);
        this.respond(response);
    }
    
    extractWebsite(cmd) {
        for (const [name, url] of Object.entries(this.websites)) {
            if (cmd.includes(name)) {
                return { name, url };
            }
        }
        return null;
    }
    
    openWebsite(website) {
        window.open(website.url, '_blank');
        this.respond(`Opening ${website.name} for you.`);
    }
    
    setTimer(amount, unit) {
        console.log('Setting timer:', amount, unit);
        
        // Convert to seconds
        let seconds;
        switch (unit) {
            case 'second': seconds = amount; break;
            case 'minute': seconds = amount * 60; break;
            case 'hour': seconds = amount * 3600; break;
            default: 
                console.error('Invalid time unit:', unit);
                return;
        }
        
        // Clear existing timer
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
        }
        
        // Show timer overlay
        if (this.elements.timerOverlay) {
            this.elements.timerOverlay.classList.remove('hidden');
            console.log('Timer overlay shown');
        } else {
            console.error('Timer overlay element not found');
        }
        
        // Update timer display
        this.updateTimerDisplay(seconds);
        
        const response = `Timer set for ${amount} ${unit}${amount > 1 ? 's' : ''}.`;
        this.respond(response);
        
        // Start countdown
        this.currentTimer = setInterval(() => {
            seconds--;
            this.updateTimerDisplay(seconds);
            
            if (seconds <= 0) {
                this.timerComplete();
            }
        }, 1000);
        
        console.log('Timer started');
    }
    
    updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (this.elements.timerTime) {
            this.elements.timerTime.textContent = display;
        }
        
        console.log('Timer display updated:', display);
    }
    
    timerComplete() {
        console.log('Timer completed');
        this.cancelTimer();
        const message = "Time's up! Your timer has finished.";
        this.respond(message);
    }
    
    cancelTimer() {
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }
        if (this.elements.timerOverlay) {
            this.elements.timerOverlay.classList.add('hidden');
        }
        console.log('Timer cancelled');
    }
    
    respond(text) {
        console.log('Responding with:', text);
        this.addMessage(text, 'ai');
        // Immediate speech without delay
        this.speak(text);
    }
    
    speak(text) {
        if (!this.synthesis) {
            console.warn('❌ Speech synthesis not available');
            return;
        }
        
        if (this.isSpeaking) {
            console.log('Already speaking, cancelling previous speech');
            this.synthesis.cancel();
        }
        
        console.log('Speaking:', text);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Get best voice
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.lang.startsWith('en') && (voice.name.includes('Google') || voice.name.includes('Female'))
        ) || voices[0];
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log('Using voice:', preferredVoice.name);
        }
        
        utterance.onstart = () => {
            console.log('Speech started');
            this.isSpeaking = true;
            if (this.elements.status) {
                this.elements.status.classList.add('speaking');
            }
            this.updateStatus('Speaking...');
        };
        
        utterance.onend = () => {
            console.log('Speech ended');
            this.isSpeaking = false;
            if (this.elements.status) {
                this.elements.status.classList.remove('speaking');
            }
            this.updateStatus('Ready');
        };
        
        utterance.onerror = (error) => {
            console.error('❌ Speech synthesis error:', error);
            this.isSpeaking = false;
            if (this.elements.status) {
                this.elements.status.classList.remove('speaking');
            }
            this.updateStatus('Ready');
        };
        
        this.synthesis.speak(utterance);
    }
    
    addMessage(text, sender) {
        console.log('Adding message:', sender, text);
        
        if (!this.elements.chatMessages) {
            console.error('❌ Chat messages element not found');
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = sender === 'user' ? '👤' : '🤖';
        const time = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p class="message-text">${text}</p>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        console.log('Message added successfully');
    }
    
    displayWelcomeMessage() {
        const hour = new Date().getHours();
        let greeting = 'Hello';
        
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        
        const message = `${greeting}! I'm JARVIS, your AI assistant. I can help you with:

• Time and date information
• Setting timers
• Basic calculations
• Telling jokes
• Opening websites (YouTube, Gmail, etc.)
• Searching the web

Try typing "What time is it?" or "Set timer for 5 minutes". Click the microphone for voice commands!`;
        
        console.log('Displaying welcome message');
        this.addMessage(message, 'ai');
        
        // Speak welcome message after a delay
        setTimeout(() => {
            this.speak("Hello! I'm JARVIS, your AI assistant. I'm ready to help you!");
        }, 1000);
    }
    
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

// Initialize JARVIS when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting JARVIS...');
    window.jarvis = new JARVIS();
});