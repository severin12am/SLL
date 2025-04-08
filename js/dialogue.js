import { createClient } from '@supabase/supabase-js';

export class DialogueManager {
    constructor(container, supabase) {
        this.container = container;
        this.supabase = supabase;
        this.dialogueHistory = [];
        this.currentStep = 0;
        this.synthesis = window.speechSynthesis;
        this.dialogueBoxes = [];
        
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.setupSpeechRecognition();
        } else {
            console.error('Speech recognition not supported in this browser');
        }
        
        // Clear container and ensure it's visible
        this.container.innerHTML = '';
        this.container.style.display = 'block';
        
        console.log('DialogueManager initialized with container:', container);
    }

    setupSpeechRecognition() {
        this.recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.toLowerCase();
            
            if (this.currentUserBox) {
                this.handleSpeechInput(transcript, this.currentTargetPhrase);
            }
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                this.recognition.start();
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (this.currentUserBox) {
                const indicator = this.currentUserBox.querySelector('.input-indicator');
                if (indicator) {
                    indicator.textContent = 'Click microphone to try again';
                }
            }
        };
    }

    async startDialogue(dialogueNumber) {
        console.log('Starting dialogue number:', dialogueNumber);
        
        try {
            // First, get the phrases in the mother language
            const { data: motherData, error: motherError } = await this.supabase
                .from('vendor_phrases')
                .select('*')
                .eq('dialogue_number', dialogueNumber)
                .eq('language', window.gameState.motherLanguage)
                .order('dialogue_step', { ascending: true });

            if (motherError || !motherData || motherData.length === 0) {
                console.error('Error fetching mother language dialogue:', motherError);
                return;
            }

            // Then, get the matching phrases in the target language
            const { data: targetData, error: targetError } = await this.supabase
                .from('vendor_phrases')
                .select('*')
                .eq('dialogue_number', dialogueNumber)
                .eq('language', window.gameState.targetLanguage)
                .order('dialogue_step', { ascending: true });

            if (targetError || !targetData || targetData.length === 0) {
                console.error('Error fetching target language dialogue:', targetError);
                return;
            }

            // Combine the data
            this.dialogueHistory = motherData.map((motherPhrase, index) => ({
                motherPhrase: motherPhrase,
                targetPhrase: targetData[index]
            }));

            console.log('Dialogue data prepared:', this.dialogueHistory);
            
            // Reset state
            this.currentStep = 0;
            this.dialogueBoxes = [];
            
            // Clear container and ensure it's visible
            this.container.innerHTML = '';
            this.container.style.display = 'block';
            
            // Show first step
            this.showNextStep();
            
        } catch (error) {
            console.error('Error in startDialogue:', error);
        }
    }

    createDialogueBox(motherPhrase, targetPhrase, isUser = false) {
        const box = document.createElement('div');
        box.className = 'dialogue-box';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'dialogue-text';
        
        // Create the phrase display
        const phraseSpan = document.createElement('span');
        phraseSpan.className = 'phrase';
        
        // Split by characters but preserve spaces
        [...targetPhrase.text].forEach(char => {
            const span = document.createElement('span');
            // Use non-breaking space for visual spaces
            span.textContent = char === ' ' ? '\u00A0' : char;
            phraseSpan.appendChild(span);
        });
        
        // Get the correct phonetic text based on mother language
        const phoneticField = `phonetic_text_${window.gameState.motherLanguage}`;
        const phoneticText = targetPhrase[phoneticField] || targetPhrase.transcription || '';
        
        const phoneticSpan = document.createElement('span');
        phoneticSpan.className = 'phonetic';
        phoneticSpan.textContent = ` [${phoneticText}] `;
        
        const translationSpan = document.createElement('span');
        translationSpan.className = 'translation';
        translationSpan.textContent = ` ${motherPhrase.text}`;
        
        textDiv.appendChild(phraseSpan);
        textDiv.appendChild(phoneticSpan);
        textDiv.appendChild(translationSpan);
        
        if (isUser) {
            // Add speech input indicator
            const inputIndicator = document.createElement('div');
            inputIndicator.className = 'input-indicator';
            inputIndicator.textContent = 'Listening...';
            textDiv.appendChild(inputIndicator);
            
            // Store reference to current box and phrase for speech recognition
            this.currentUserBox = box;
            this.currentTargetPhrase = targetPhrase.text;
            
            // Start listening automatically
            this.startListening();
        }
        
        const controls = document.createElement('div');
        controls.className = 'dialogue-controls';
        
        const soundButton = document.createElement('button');
        soundButton.innerHTML = '🔊';
        soundButton.onclick = () => this.playPhrase(targetPhrase.text);
        
        const returnButton = document.createElement('button');
        returnButton.innerHTML = '↩';
        returnButton.onclick = () => this.handleReturnClick(event);
        
        controls.appendChild(soundButton);
        controls.appendChild(returnButton);
        
        box.appendChild(textDiv);
        box.appendChild(controls);
        
        return box;
    }

    startListening() {
        if (!this.recognition) return;
        
        this.isListening = true;
        this.recognition.lang = window.gameState.targetLanguage;
        this.recognition.start();
        
        if (this.currentUserBox) {
            this.currentUserBox.setAttribute('data-listening', 'true');
            const indicator = this.currentUserBox.querySelector('.input-indicator');
            if (indicator) {
                indicator.textContent = 'Listening...';
            }
        }
    }

    stopListening() {
        if (!this.recognition) return;
        
        this.isListening = false;
        this.recognition.stop();
        
        if (this.currentUserBox) {
            this.currentUserBox.removeAttribute('data-listening');
            const indicator = this.currentUserBox.querySelector('.input-indicator');
            if (indicator && indicator.textContent === 'Listening...') {
                indicator.textContent = 'Say the phrase...';
            }
        }
    }

    handleReturnClick(event) {
        const clickedBox = event.target.closest('.dialogue-box');
        if (!clickedBox) return;
        
        const targetStep = parseInt(clickedBox.getAttribute('data-step'));
        
        // Stop current listening if any
        this.stopListening();
        
        // Remove all dialogue boxes after the clicked one
        const allBoxes = Array.from(document.querySelectorAll('.dialogue-box'));
        const boxIndex = allBoxes.indexOf(clickedBox);
        
        // Remove boxes after the clicked one with animation
        allBoxes.slice(boxIndex + 1).forEach(box => {
            box.classList.add('sliding-up');
            setTimeout(() => box.remove(), 300);
        });
        
        // Set the current step to the clicked box's step
        this.currentStep = targetStep;
        
        // Reset the current user box and target phrase
        if (this.isUserTurn(targetStep)) {
            this.currentUserBox = clickedBox;
            // Get the correct target phrase from dialogue history
            const dialogueItem = this.dialogueHistory[targetStep];
            if (dialogueItem) {
                this.currentTargetPhrase = dialogueItem.targetPhrase.text;
                
                // Reset the input indicator
                const indicator = clickedBox.querySelector('.input-indicator');
                if (indicator) {
                    indicator.textContent = 'Say the phrase...';
                    indicator.style.color = ''; // Reset color
                }
                
                // Remove any existing highlighting
                const phraseSpans = clickedBox.querySelectorAll('.phrase span');
                phraseSpans.forEach(span => {
                    span.classList.remove('matched');
                });
                
                // Start listening again
                this.startListening();
            }
        }
    }

    isUserTurn(step) {
        return step % 2 === 0;
    }

    handleSpeechInput(transcript, targetPhrase) {
        console.log('Speech input:', transcript);
        console.log('Target phrase:', targetPhrase);
        
        const target = targetPhrase.toLowerCase();
        const transcriptLower = transcript.toLowerCase();
        
        // Calculate match percentage using Levenshtein distance
        const distance = this.levenshteinDistance(transcriptLower, target);
        const matchPercentage = ((target.length - distance) / target.length) * 100;
        
        // Highlight matching words
        if (this.currentUserBox) {
            const phraseSpans = this.currentUserBox.querySelectorAll('.phrase span');
            const targetWords = target.split(/\s+/);
            const transcriptWords = transcriptLower.split(/\s+/);
            
            // Create a map of which characters belong to which word
            let currentWordIndex = 0;
            const charToWordMap = new Array(target.length);
            let charCount = 0;
            
            targetWords.forEach((word, wordIndex) => {
                for (let i = 0; i < word.length; i++) {
                    charToWordMap[charCount + i] = wordIndex;
                }
                charCount += word.length + 1; // +1 for space
            });
            
            // Check each word for matches
            const wordMatches = targetWords.map((targetWord, index) => {
                if (index < transcriptWords.length) {
                    const wordDistance = this.levenshteinDistance(transcriptWords[index], targetWord);
                    // Consider a word matched if it's at least 60% similar
                    return (wordDistance / targetWord.length) <= 0.4;
                }
                return false;
            });
            
            // Apply highlighting based on word matches
            phraseSpans.forEach((span, i) => {
                if (i < charToWordMap.length) {
                    const wordIndex = charToWordMap[i];
                    if (wordMatches[wordIndex]) {
                        span.classList.add('matched');
                    } else {
                        span.classList.remove('matched');
                    }
                }
            });
            
            const indicator = this.currentUserBox.querySelector('.input-indicator');
            if (indicator) {
                indicator.textContent = `Match: ${Math.round(matchPercentage)}%`;
            }
        }
        
        // If match percentage is over 60%, proceed to next step
        if (matchPercentage >= 60) {
            this.stopListening();
            
            // Show success indicator immediately
            if (this.currentUserBox) {
                const indicator = this.currentUserBox.querySelector('.input-indicator');
                if (indicator) {
                    indicator.textContent = 'Good job! ✓';
                    indicator.style.color = '#4CAF50';
                }
            }
            
            // Get the current step from the box
            const currentBoxStep = parseInt(this.currentUserBox.getAttribute('data-step'));
            
            // Update the current step to continue from this point
            this.currentStep = currentBoxStep + 1;
            
            // Remove highlighting after a delay
            setTimeout(() => {
                if (this.currentUserBox) {
                    const phraseSpans = this.currentUserBox.querySelectorAll('.phrase span');
                    phraseSpans.forEach(span => {
                        span.classList.remove('matched');
                    });
                }
            }, 500);
            
            // Wait a moment before proceeding to next step
            setTimeout(() => {
                this.showNextStep();
            }, 1000);  // Increased to 1000ms to ensure highlighting is visible before moving on
        }
    }

    levenshteinDistance(s1, s2) {
        const m = s1.length;
        const n = s2.length;
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
        
        for (let i = 0; i <= m; i++) {
            dp[i][0] = i;
        }
        for (let j = 0; j <= n; j++) {
            dp[0][j] = j;
        }
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (s1[i - 1] === s2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j - 1] + 1,
                        dp[i - 1][j] + 1,
                        dp[i][j - 1] + 1
                    );
                }
            }
        }
        
        return dp[m][n];
    }

    playPhrase(phrase) {
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.lang = window.gameState.targetLanguage;
        
        // Calculate approximate duration (100ms per character + 500ms base)
        const estimatedDuration = phrase.length * 100 + 500;
        
        // Return a promise that resolves when speech is done
        return new Promise((resolve) => {
            utterance.onend = () => {
                resolve();
            };
            
            // Fallback in case onend doesn't fire
            setTimeout(resolve, estimatedDuration);
            
            this.synthesis.speak(utterance);
        });
    }

    async showNextStep() {
        if (this.currentStep >= this.dialogueHistory.length) {
            console.log('Dialogue sequence completed');
            return;
        }

        const currentDialogue = this.dialogueHistory[this.currentStep];
        console.log('Showing dialogue step:', currentDialogue);
        
        const isUserTurn = this.currentStep % 2 === 0;
        
        // Check if this box has already been shown
        const existingBox = this.dialogueBoxes.find(box => 
            parseInt(box.getAttribute('data-step')) === this.currentStep
        );
        
        if (existingBox) {
            console.log('Box already exists for step:', this.currentStep);
            this.currentStep++;
            return;
        }
        
        // Remove any boxes that shouldn't be there
        const extraBoxes = this.dialogueBoxes.filter(box => 
            parseInt(box.getAttribute('data-step')) >= this.currentStep
        );
        extraBoxes.forEach(box => {
            box.remove();
            this.dialogueBoxes = this.dialogueBoxes.filter(b => b !== box);
        });
        
        const box = this.createDialogueBox(
            currentDialogue.motherPhrase,
            currentDialogue.targetPhrase,
            isUserTurn
        );
        
        // Mark the box with its step number
        box.setAttribute('data-step', this.currentStep.toString());
        
        // Add box to container
        this.container.appendChild(box);
        this.dialogueBoxes.push(box);
        
        // Animate new box in
        requestAnimationFrame(() => {
            box.classList.add('active');
        });

        // If it's vendor's turn, automatically play the audio and proceed
        if (!isUserTurn) {
            // Play the vendor's response and wait for it to finish
            await this.playPhrase(currentDialogue.targetPhrase.text);
            
            // Proceed to next step immediately after speech finishes
            this.currentStep++;
            this.showNextStep();
        } else {
            // For user turns, set this as the current user box for speech recognition
            this.currentUserBox = box;
            this.currentStep++;
        }
    }
}

export function initializeDialogue(container, supabase) {
    return new DialogueManager(container, supabase);
} 