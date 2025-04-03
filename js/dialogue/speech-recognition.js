import { getGameState } from '../game/game-manager.js';
import { highlightMatchedWords } from '../utils/text-matching.js';

// Speech recognition instance
let recognition = null;
let isRecognizing = false;

// Recognition callback function
let recognitionCallback = null;

// Visual feedback element
let visualFeedback = null;

/**
 * Initialize speech recognition
 * @returns {boolean} True if speech recognition is supported
 */
export function initSpeechRecognition() {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported in this browser');
        return false;
    }
    
    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = false;
    recognition.interimResults = true;
    
    // Create visual feedback element
    createVisualFeedback();
    
    return true;
}

/**
 * Create visual feedback element for speech recognition
 */
function createVisualFeedback() {
    // Create feedback container
    visualFeedback = document.createElement('div');
    visualFeedback.className = 'speech-feedback';
    visualFeedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 20px;
        font-size: 16px;
        text-align: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    `;
    
    // Add microphone icon
    const micIcon = document.createElement('span');
    micIcon.innerHTML = '🎤 ';
    visualFeedback.appendChild(micIcon);
    
    // Add text container
    const textSpan = document.createElement('span');
    textSpan.className = 'speech-text';
    textSpan.textContent = 'Listening...';
    visualFeedback.appendChild(textSpan);
    
    // Add to document
    document.body.appendChild(visualFeedback);
}

/**
 * Start speech recognition with callback
 * @param {Function} callback - Function to call with recognition result
 */
export function startSpeechRecognition(callback) {
    if (!recognition) {
        if (!initSpeechRecognition()) {
            console.error('Could not initialize speech recognition');
            return;
        }
    }
    
    if (isRecognizing) {
        stopSpeechRecognition();
    }
    
    recognitionCallback = callback;
    
    // Set up recognition handlers
    setupRecognitionHandlers();
    
    // Get language from game state
    const gameState = getGameState();
    if (gameState && gameState.languageConfig && gameState.languageConfig.recognitionLang) {
        recognition.lang = gameState.languageConfig.recognitionLang;
    } else {
        recognition.lang = 'en-US';
    }
    
    // Start recognition
    try {
        recognition.start();
        isRecognizing = true;
        showVisualFeedback();
        console.log('Speech recognition started');
    } catch (error) {
        console.error('Error starting speech recognition:', error);
    }
}

/**
 * Set up recognition event handlers
 */
function setupRecognitionHandlers() {
    recognition.onstart = () => {
        console.log('Speech recognition service has started');
    };
    
    recognition.onresult = (event) => {
        // Get recognition result
        const result = event.results[0];
        const transcript = result[0].transcript.trim();
        
        // Update visual feedback with interim results
        updateVisualFeedback(transcript, !result.isFinal);
        
        // If final result, call callback
        if (result.isFinal && recognitionCallback) {
            // Slight delay to show the final transcript
            setTimeout(() => {
                recognitionCallback(transcript);
                
                // Auto-restart recognition for continuous input
                if (isRecognizing) {
                    try {
                        recognition.start();
                    } catch (error) {
                        console.warn('Error restarting recognition:', error);
                    }
                }
            }, 500);
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        hideVisualFeedback();
        
        // Restart on non-fatal errors
        if (event.error !== 'aborted' && event.error !== 'not-allowed' && isRecognizing) {
            try {
                setTimeout(() => recognition.start(), 1000);
            } catch (error) {
                console.warn('Could not restart recognition after error:', error);
            }
        }
    };
    
    recognition.onend = () => {
        console.log('Speech recognition service disconnected');
        
        // If still supposed to be recognizing, restart
        if (isRecognizing) {
            try {
                recognition.start();
            } catch (error) {
                console.warn('Could not restart recognition:', error);
                isRecognizing = false;
                hideVisualFeedback();
            }
        } else {
            hideVisualFeedback();
        }
    };
}

/**
 * Stop speech recognition
 */
export function stopSpeechRecognition() {
    if (recognition && isRecognizing) {
        try {
            recognition.stop();
            console.log('Speech recognition stopped');
        } catch (error) {
            console.warn('Error stopping recognition:', error);
        }
    }
    
    isRecognizing = false;
    recognitionCallback = null;
    hideVisualFeedback();
}

/**
 * Show visual feedback for speech recognition
 */
function showVisualFeedback() {
    if (visualFeedback) {
        visualFeedback.style.opacity = '1';
    }
}

/**
 * Hide visual feedback for speech recognition
 */
function hideVisualFeedback() {
    if (visualFeedback) {
        visualFeedback.style.opacity = '0';
    }
}

/**
 * Update visual feedback with current transcript
 * @param {string} text - Current recognized text
 * @param {boolean} interim - Whether this is an interim result
 */
function updateVisualFeedback(text, interim) {
    if (!visualFeedback) return;
    
    const textSpan = visualFeedback.querySelector('.speech-text');
    if (!textSpan) return;
    
    // Get active dialogue options for highlighting
    const gameState = getGameState();
    let options = [];
    
    if (gameState.activeCharacter && gameState.currentStep) {
        const charId = gameState.activeCharacter.id;
        const dialogueElement = document.querySelector(`.dialogue-box[data-character="${charId}"]`);
        
        if (dialogueElement) {
            const optionElements = dialogueElement.querySelectorAll('.dialogue-option');
            options = Array.from(optionElements).map(el => el.textContent);
        }
    }
    
    // Highlight matching words if options are available
    if (options.length > 0) {
        const highlightedText = highlightMatchedWords(text, options);
        textSpan.innerHTML = interim ? `${highlightedText}...` : highlightedText;
    } else {
        textSpan.textContent = interim ? `${text}...` : text;
    }
} 