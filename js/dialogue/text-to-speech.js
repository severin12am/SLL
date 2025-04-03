/**
 * Text-to-Speech Module
 * Handles speech synthesis for character dialogues
 */

import { getGameState } from '../game/game-manager.js';
import { logger } from '../utils/logger.js';

// Speech synthesis instance
let synthesizer = null;
let isSpeaking = false;
let speechQueue = [];
let currentCharacter = null;

/**
 * Initialize text-to-speech
 * @returns {boolean} Whether speech synthesis is supported
 */
function initTextToSpeech() {
    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
        logger.warn('Text-to-speech not supported in this browser', 'TTS');
        return false;
    }
    
    synthesizer = window.speechSynthesis;
    logger.info('Text-to-speech initialized', 'TTS');
    return true;
}

/**
 * Get voice for character
 * @param {string} characterId - ID of the character
 * @returns {SpeechSynthesisVoice} The selected voice
 */
function getVoiceForCharacter(characterId) {
    if (!synthesizer) {
        if (!initTextToSpeech()) {
            return null;
        }
    }
    
    // Wait for voices to be loaded if needed
    const voices = synthesizer.getVoices();
    if (voices.length === 0) {
        // If no voices loaded yet, return null and try again later
        return null;
    }
    
    // Get language from game state
    const gameState = getGameState();
    const language = gameState.languageConfig?.language || 'en-US';
    
    // Get appropriate voice based on character and language
    let voice = null;
    
    switch (characterId) {
        case 'vendor':
            // Deep male voice for vendor
            voice = voices.find(v => v.name.includes('Male') && v.lang.includes(language.split('-')[0]));
            break;
        case 'cat':
            // Higher pitched voice for cat
            voice = voices.find(v => v.name.includes('Female') && v.lang.includes(language.split('-')[0]));
            break;
        default:
            // Default voice
            voice = voices.find(v => v.lang.includes(language.split('-')[0]));
            break;
    }
    
    // Fallback to any voice in the right language
    if (!voice) {
        voice = voices.find(v => v.lang.includes(language.split('-')[0]));
    }
    
    // Fallback to any voice
    if (!voice && voices.length > 0) {
        voice = voices[0];
    }
    
    return voice;
}

/**
 * Speak text for a character
 * @param {string} text - Text to speak
 * @param {string} characterId - ID of the speaking character
 */
export function speak(text, characterId) {
    if (!text || text.trim() === '') return;
    
    // Get game state
    const gameState = getGameState();
    
    // Check if TTS is enabled in settings
    if (!gameState.languageConfig?.textToSpeech) {
        logger.debug('Text-to-speech is disabled in settings', 'TTS');
        return;
    }
    
    // Initialize TTS if needed
    if (!synthesizer) {
        if (!initTextToSpeech()) {
            return;
        }
    }
    
    // Store current character
    currentCharacter = characterId;
    
    // Add to speech queue
    speechQueue.push({ text, characterId });
    
    // Start speaking if not already
    if (!isSpeaking) {
        processNextSpeech();
    }
}

/**
 * Process next item in speech queue
 */
function processNextSpeech() {
    // If queue is empty or already speaking, return
    if (speechQueue.length === 0 || isSpeaking) {
        return;
    }
    
    // Get next speech item
    const { text, characterId } = speechQueue.shift();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const voice = getVoiceForCharacter(characterId);
    if (voice) {
        utterance.voice = voice;
    }
    
    // Set properties based on character
    switch (characterId) {
        case 'vendor':
            utterance.pitch = 0.9;
            utterance.rate = 0.9;
            break;
        case 'cat':
            utterance.pitch = 1.3;
            utterance.rate = 1.1;
            break;
        default:
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
            break;
    }
    
    // Set handlers
    utterance.onstart = () => {
        isSpeaking = true;
        logger.debug(`Speaking for ${characterId}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`, 'TTS');
    };
    
    utterance.onend = () => {
        isSpeaking = false;
        // Process next speech if queue is not empty
        if (speechQueue.length > 0) {
            processNextSpeech();
        }
    };
    
    utterance.onerror = (event) => {
        logger.error(`Speech synthesis error: ${event.error}`, 'TTS');
        isSpeaking = false;
        
        // Try to process next speech
        if (speechQueue.length > 0) {
            processNextSpeech();
        }
    };
    
    // Speak
    try {
        synthesizer.speak(utterance);
    } catch (error) {
        logger.error(`Error in speech synthesis: ${error.message}`, 'TTS');
        isSpeaking = false;
    }
}

/**
 * Stop speaking
 */
export function stopSpeaking() {
    if (!synthesizer) return;
    
    // Clear queue and stop speaking
    speechQueue = [];
    synthesizer.cancel();
    isSpeaking = false;
    logger.debug('Speech stopped', 'TTS');
}

/**
 * Wait for voices to be loaded
 * @returns {Promise} Promise that resolves when voices are loaded
 */
export function waitForVoices() {
    return new Promise((resolve) => {
        if (!synthesizer) {
            if (!initTextToSpeech()) {
                resolve([]);
                return;
            }
        }
        
        // Check if voices are already loaded
        const voices = synthesizer.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }
        
        // Wait for voices to load
        const voicesChanged = () => {
            const voices = synthesizer.getVoices();
            resolve(voices);
        };
        
        // Different browsers use different events
        if ('onvoiceschanged' in synthesizer) {
            synthesizer.onvoiceschanged = voicesChanged;
        } else {
            // Fallback for browsers that don't support onvoiceschanged
            setTimeout(voicesChanged, 1000);
        }
    });
} 