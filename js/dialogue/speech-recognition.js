/**
 * Speech Recognition Module
 * Handles voice input for dialogues
 */

import { getGameState } from '../game/game-manager.js';
import { logger } from '../utils/logger.js';

// Speech recognition instance
let recognition = null;
let isRecognizing = false;
let onResultCallback = null;
let visualFeedback = null;

/**
 * Initialize speech recognition
 * @returns {boolean} Whether speech recognition is supported
 */
function initSpeechRecognition() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        logger.warn('Speech recognition not supported in this browser', 'SPEECH');
        return false;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    
    logger.info('Speech recognition initialized', 'SPEECH');
    return true;
}

/**
 * Create visual feedback element for speech recognition
 */
function createVisualFeedback() {
    // Check if feedback element already exists
    if (document.getElementById('speech-feedback')) {
        visualFeedback = document.getElementById('speech-feedback');
        return;
    }
    
    // Create feedback container
    visualFeedback = document.createElement('div');
    visualFeedback.id = 'speech-feedback';
    visualFeedback.style.position = 'fixed';
    visualFeedback.style.bottom = '20px';
    visualFeedback.style.left = '50%';
    visualFeedback.style.transform = 'translateX(-50%)';
    visualFeedback.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    visualFeedback.style.color = '#fff';
    visualFeedback.style.padding = '10px 20px';
    visualFeedback.style.borderRadius = '30px';
    visualFeedback.style.display = 'none';
    visualFeedback.style.zIndex = '1000';
    visualFeedback.style.fontFamily = 'Arial, sans-serif';
    visualFeedback.style.fontSize = '16px';
    visualFeedback.style.maxWidth = '80%';
    
    // Add microphone icon
    const micIcon = document.createElement('span');
    micIcon.innerHTML = '🎤';
    micIcon.style.marginRight = '10px';
    visualFeedback.appendChild(micIcon);
    
    // Add text element
    const textElement = document.createElement('span');
    textElement.className = 'speech-text';
    textElement.textContent = 'Listening...';
    visualFeedback.appendChild(textElement);
    
    // Add to body
    document.body.appendChild(visualFeedback);
}

/**
 * Start speech recognition
 * @param {Function} callback - Function to call with recognition results
 */
export function startSpeechRecognition(callback) {
    // Initialize if not already done
    if (!recognition && !initSpeechRecognition()) {
        logger.error('Failed to initialize speech recognition', 'SPEECH');
        return;
    }
    
    // Don't start if already recognizing
    if (isRecognizing) {
        logger.debug('Speech recognition already active', 'SPEECH');
        return;
    }
    
    // Store callback
    onResultCallback = callback;
    
    // Get language setting from game state
    const gameState = getGameState();
    const language = gameState.languageConfig?.language || 'en-US';
    
    // Set recognition language
    recognition.lang = language;
    
    // Create visual feedback
    createVisualFeedback();
    
    // Setup recognition handlers
    setupRecognitionHandlers();
    
    // Start recognition
    try {
        recognition.start();
        isRecognizing = true;
        showVisualFeedback();
        logger.info('Speech recognition started', 'SPEECH');
    } catch (error) {
        logger.error('Error starting speech recognition: ' + error.message, 'SPEECH');
        isRecognizing = false;
    }
}

/**
 * Set up speech recognition event handlers
 */
function setupRecognitionHandlers() {
    // Handle results
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // Process results
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update visual feedback
        updateVisualFeedback(interimTranscript, finalTranscript);
        
        // If we have final results, call the callback
        if (finalTranscript !== '' && onResultCallback) {
            logger.debug('Speech recognition final result: ' + finalTranscript, 'SPEECH');
            onResultCallback(finalTranscript);
        }
    };
    
    // Handle errors
    recognition.onerror = (event) => {
        logger.error('Speech recognition error: ' + event.error, 'SPEECH');
        
        // Special handling for specific errors
        if (event.error === 'no-speech') {
            updateVisualFeedback('No speech detected', '');
        } else if (event.error === 'audio-capture') {
            updateVisualFeedback('No microphone detected', '');
        } else if (event.error === 'not-allowed') {
            updateVisualFeedback('Microphone access denied', '');
        }
    };
    
    // Handle end of recognition
    recognition.onend = () => {
        logger.debug('Speech recognition ended', 'SPEECH');
        
        // If still supposed to be recognizing, restart
        if (isRecognizing) {
            try {
                recognition.start();
                logger.debug('Speech recognition restarted', 'SPEECH');
            } catch (error) {
                logger.error('Error restarting speech recognition: ' + error.message, 'SPEECH');
                hideVisualFeedback();
                isRecognizing = false;
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
    if (!recognition || !isRecognizing) {
        return;
    }
    
    try {
        recognition.stop();
        logger.info('Speech recognition stopped', 'SPEECH');
    } catch (error) {
        logger.error('Error stopping speech recognition: ' + error.message, 'SPEECH');
    }
    
    isRecognizing = false;
    onResultCallback = null;
    hideVisualFeedback();
}

/**
 * Show visual feedback for speech recognition
 */
function showVisualFeedback() {
    if (visualFeedback) {
        visualFeedback.style.display = 'block';
    }
}

/**
 * Hide visual feedback for speech recognition
 */
function hideVisualFeedback() {
    if (visualFeedback) {
        visualFeedback.style.display = 'none';
    }
}

/**
 * Update visual feedback with current recognition results
 * @param {string} interim - Interim recognition results
 * @param {string} final - Final recognition results
 */
function updateVisualFeedback(interim, final) {
    if (!visualFeedback) return;
    
    const textElement = visualFeedback.querySelector('.speech-text');
    if (!textElement) return;
    
    // Show final or interim text
    const displayText = final || interim || 'Listening...';
    textElement.textContent = displayText;
    
    // Highlight matching words
    const gameState = getGameState();
    if (gameState.dialogueOptions && gameState.dialogueOptions.length > 0) {
        // Implementation for highlighting words that match dialogue options
        // This would need to be customized based on your dialogue UI approach
    }
} 