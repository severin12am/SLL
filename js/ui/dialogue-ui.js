/**
 * Dialogue UI Module
 * Handles the visual elements of the dialogue system
 */

import { logger } from '../utils/logger.js';
import { speak, stopSpeaking } from '../dialogue/text-to-speech.js';
import { getGameState } from '../game/game-manager.js';

// Dialogue UI elements
let dialogueContainer = null;
let activeDialogueBoxes = {};

/**
 * Initialize dialogue UI
 */
export function initDialogueUI() {
    // Create dialogue container if it doesn't exist
    if (!dialogueContainer) {
        createDialogueContainer();
    }
    
    logger.info('Dialogue UI initialized', 'DIALOGUE_UI');
}

/**
 * Create the main dialogue container
 */
function createDialogueContainer() {
    // Check if container already exists
    dialogueContainer = document.getElementById('dialogue-container');
    if (dialogueContainer) return;
    
    // Create container
    dialogueContainer = document.createElement('div');
    dialogueContainer.id = 'dialogue-container';
    dialogueContainer.style.position = 'fixed';
    dialogueContainer.style.bottom = '100px';
    dialogueContainer.style.left = '50%';
    dialogueContainer.style.transform = 'translateX(-50%)';
    dialogueContainer.style.width = '80%';
    dialogueContainer.style.maxWidth = '600px';
    dialogueContainer.style.zIndex = '100';
    dialogueContainer.style.pointerEvents = 'auto';
    
    // Add to document
    document.body.appendChild(dialogueContainer);
    
    // Add styles to document
    addDialogueStyles();
}

/**
 * Add dialogue CSS styles to document
 */
function addDialogueStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .dialogue-box {
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            font-family: 'Arial', sans-serif;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .dialogue-box.vendor {
            border-left: 5px solid #ffd700;
        }
        
        .dialogue-box.cat {
            border-left: 5px solid #9c27b0;
        }
        
        .dialogue-box.disappearing {
            opacity: 0;
            transform: translateY(20px);
        }
        
        .dialogue-text {
            font-size: 16px;
            line-height: 1.4;
            margin-bottom: 15px;
        }
        
        .dialogue-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .dialogue-option {
            background-color: rgba(80, 80, 80, 0.6);
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .dialogue-option:hover {
            background-color: rgba(100, 100, 100, 0.8);
        }
        
        .dialogue-option.selected {
            background-color: rgba(65, 105, 225, 0.8);
        }
        
        .dialogue-option.matched {
            background-color: rgba(50, 205, 50, 0.6);
        }
        
        @keyframes pulse {
            0% { background-color: rgba(65, 105, 225, 0.6); }
            50% { background-color: rgba(65, 105, 225, 0.8); }
            100% { background-color: rgba(65, 105, 225, 0.6); }
        }
        
        .dialogue-option.pulsing {
            animation: pulse 2s infinite;
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Create a dialogue box for a character
 * @param {string} characterId - ID of the character
 * @returns {HTMLElement} The created dialogue box
 */
export function createDialogueBox(characterId) {
    // Make sure container exists
    if (!dialogueContainer) {
        initDialogueUI();
    }
    
    // Check if dialogue box already exists for this character
    if (activeDialogueBoxes[characterId]) {
        return activeDialogueBoxes[characterId];
    }
    
    // Create dialogue box
    const dialogueBox = document.createElement('div');
    dialogueBox.className = 'dialogue-box';
    dialogueBox.classList.add(characterId);
    dialogueBox.setAttribute('data-character', characterId);
    
    // Add dialogue text
    const textElement = document.createElement('div');
    textElement.className = 'dialogue-text';
    dialogueBox.appendChild(textElement);
    
    // Add options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'dialogue-options';
    dialogueBox.appendChild(optionsContainer);
    
    // Hide by default
    dialogueBox.style.display = 'none';
    
    // Add to container
    dialogueContainer.appendChild(dialogueBox);
    
    // Store reference
    activeDialogueBoxes[characterId] = dialogueBox;
    
    return dialogueBox;
}

/**
 * Set text for a dialogue box
 * @param {string} characterId - ID of the character
 * @param {string} text - Text to display
 */
export function setDialogueText(characterId, text) {
    // Get dialogue box
    const dialogueBox = getDialogueBox(characterId);
    if (!dialogueBox) return;
    
    // Update text
    const textElement = dialogueBox.querySelector('.dialogue-text');
    if (textElement) {
        textElement.textContent = text;
        
        // Use TTS if enabled
        const gameState = getGameState();
        if (gameState.languageConfig?.textToSpeech) {
            speak(text, characterId);
        }
    }
}

/**
 * Set options for a dialogue box
 * @param {string} characterId - ID of the character
 * @param {Array} options - Array of dialogue options
 */
export function setDialogueOptions(characterId, options) {
    // Get dialogue box
    const dialogueBox = getDialogueBox(characterId);
    if (!dialogueBox) return;
    
    // Get options container
    const optionsContainer = dialogueBox.querySelector('.dialogue-options');
    if (!optionsContainer) return;
    
    // Clear existing options
    optionsContainer.innerHTML = '';
    
    // Add new options
    if (options && options.length > 0) {
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'dialogue-option';
            optionElement.textContent = option.text;
            optionElement.setAttribute('data-index', index);
            optionElement.setAttribute('data-next', option.next);
            
            // Add click handler
            optionElement.addEventListener('click', () => {
                handleOptionClick(characterId, index, option.next);
            });
            
            optionsContainer.appendChild(optionElement);
        });
        
        // Store options in game state for speech recognition
        const gameState = getGameState();
        gameState.dialogueOptions = options.map(opt => opt.text);
    }
}

/**
 * Handle dialogue option click
 * @param {string} characterId - ID of the character
 * @param {number} index - Index of the selected option
 * @param {string} nextStep - ID of the next dialogue step
 */
function handleOptionClick(characterId, index, nextStep) {
    // Highlight selected option
    highlightOption(characterId, index);
    
    // Stop any TTS if active
    stopSpeaking();
    
    // Call next step handler
    const gameState = getGameState();
    if (gameState.onDialogueOptionSelected) {
        gameState.onDialogueOptionSelected(characterId, nextStep);
    }
}

/**
 * Highlight a dialogue option
 * @param {string} characterId - ID of the character
 * @param {number} index - Index of the option to highlight
 */
export function highlightOption(characterId, index) {
    // Get dialogue box
    const dialogueBox = getDialogueBox(characterId);
    if (!dialogueBox) return;
    
    // Get all options
    const options = dialogueBox.querySelectorAll('.dialogue-option');
    
    // Remove highlight from all options
    options.forEach(option => {
        option.classList.remove('selected');
        option.classList.remove('pulsing');
    });
    
    // Add highlight to selected option
    const selectedOption = options[index];
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

/**
 * Show dialogue box for a character
 * @param {string} characterId - ID of the character
 */
export function showDialogueBox(characterId) {
    // Get dialogue box
    const dialogueBox = getDialogueBox(characterId);
    if (!dialogueBox) return;
    
    // Show dialogue box
    dialogueBox.style.display = 'block';
    dialogueBox.classList.remove('disappearing');
}

/**
 * Hide dialogue box for a character
 * @param {string} characterId - ID of the character
 */
export function hideDialogueBox(characterId) {
    // Get dialogue box
    const dialogueBox = getDialogueBox(characterId);
    if (!dialogueBox) return;
    
    // Hide with animation
    dialogueBox.classList.add('disappearing');
    
    // Remove after animation
    setTimeout(() => {
        dialogueBox.style.display = 'none';
    }, 300);
}

/**
 * Get dialogue box for a character
 * @param {string} characterId - ID of the character
 * @returns {HTMLElement} The dialogue box element
 */
function getDialogueBox(characterId) {
    // Create if doesn't exist
    if (!activeDialogueBoxes[characterId]) {
        return createDialogueBox(characterId);
    }
    
    return activeDialogueBoxes[characterId];
}

/**
 * Update dialogue option to show progress (for speech recognition)
 * @param {string} characterId - ID of the character
 * @param {number} index - Index of the matched option
 * @param {string} matchText - The matched text
 */
export function updateDialogueProgress(characterId, index, matchText) {
    // Get dialogue box
    const dialogueBox = getDialogueBox(characterId);
    if (!dialogueBox) return;
    
    // Get all options
    const options = dialogueBox.querySelectorAll('.dialogue-option');
    
    // Remove matched class from all options
    options.forEach(option => {
        option.classList.remove('matched');
        option.classList.remove('pulsing');
    });
    
    // Add matched class to matched option
    const matchedOption = options[index];
    if (matchedOption) {
        matchedOption.classList.add('matched');
        matchedOption.classList.add('pulsing');
        
        // Log the match
        logger.debug(`Matched dialogue option: "${matchText}"`, 'DIALOGUE_UI');
    }
}

/**
 * Clear all dialogue boxes
 */
export function clearAllDialogueBoxes() {
    // Hide all dialogue boxes
    Object.keys(activeDialogueBoxes).forEach(characterId => {
        hideDialogueBox(characterId);
    });
    
    // Clear references
    activeDialogueBoxes = {};
    
    // Stop any TTS
    stopSpeaking();
} 