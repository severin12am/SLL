/**
 * Dialogue System Module
 * Handles character dialogues and interactions
 */

import { getCharacter } from '../characters/character-loader.js';
import { playAnimation } from '../characters/animations.js';
import { startSpeechRecognition, stopSpeechRecognition } from './speech-recognition.js';
import { findBestMatch } from '../utils/text-matching.js';
import { speak } from './text-to-speech.js';
import { createDialogueBox, updateDialogueProgress } from '../ui/dialogue-ui.js';
import { getGameState, resetDialogue, setDialogueActive, setDialogueCooldown, setActiveCharacter } from '../game/game-manager.js';
import { DIALOGUE_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';

// Dialogue cooldown timer (ms)
const DIALOGUE_COOLDOWN = 1000;
let lastDialogueTime = 0;

// Dialogue data for characters
const dialogueData = {
    vendor: {
        greeting: {
            text: "Hello there! Welcome to my shop. What would you like to see?",
            options: [
                { text: "Show me your weapons", next: "weapons" },
                { text: "I'd like to see armor", next: "armor" },
                { text: "What potions do you have?", next: "potions" },
                { text: "No thanks, just browsing", next: "farewell" }
            ]
        },
        weapons: {
            text: "I have swords, bows, and daggers. What interests you?",
            options: [
                { text: "Tell me about your swords", next: "swords" },
                { text: "Show me your bows", next: "bows" },
                { text: "Let's see the daggers", next: "daggers" },
                { text: "Actually, I'll look at something else", next: "greeting" }
            ]
        },
        armor: {
            text: "I have light, medium, and heavy armor sets. Which would you prefer?",
            options: [
                { text: "Light armor for me", next: "light_armor" },
                { text: "Medium armor sounds good", next: "medium_armor" },
                { text: "Heavy armor is what I need", next: "heavy_armor" },
                { text: "I'll check something else", next: "greeting" }
            ]
        },
        potions: {
            text: "Health, mana, and strength potions are available. What do you need?",
            options: [
                { text: "Health potions please", next: "health_potions" },
                { text: "I need mana potions", next: "mana_potions" },
                { text: "Strength potions sound useful", next: "strength_potions" },
                { text: "Let me see something else", next: "greeting" }
            ]
        },
        farewell: {
            text: "Alright then, come back if you need anything!",
            options: []
        }
    },
    cat: {
        greeting: {
            text: "Meow! I'm not just any cat - I'm a magical cat! Want to see a trick?",
            options: [
                { text: "Yes, show me a trick", next: "magic_trick" },
                { text: "Tell me about yourself", next: "about" },
                { text: "No thanks, just passing by", next: "farewell" }
            ]
        },
        magic_trick: {
            text: "Abracadabra! *The cat's eyes glow and small sparkles appear around its paws*",
            options: [
                { text: "That's amazing!", next: "happy" },
                { text: "Is that all you can do?", next: "offended" },
                { text: "How did you learn magic?", next: "history" }
            ]
        },
        about: {
            text: "I was an ordinary cat until a wizard's experiment went wrong. Now I can talk and do magic!",
            options: [
                { text: "That's fascinating", next: "history" },
                { text: "Do you miss being normal?", next: "normal" },
                { text: "I should go now", next: "farewell" }
            ]
        },
        history: {
            text: "I've been studying magic for three cat-years now. That's about 15 in human years!",
            options: [
                { text: "What else can you do?", next: "magic_trick" },
                { text: "I'll see you around", next: "farewell" }
            ]
        },
        farewell: {
            text: "Meow! Come back anytime, human!",
            options: []
        }
    }
};

// Track the current dialogue state
let currentCharacter = null;
let currentDialogueStep = null;
let dialogueBox = null;
let isInDialogue = false;

/**
 * Check if player is close enough to start dialogue with a character
 * @param {Object} character - The character to check distance to
 * @returns {boolean} Whether player is close enough
 */
function isPlayerCloseEnough(character) {
    const gameState = getGameState();
    if (!gameState.player || !character) return false;
    
    const playerPos = gameState.player.position;
    const charPos = character.position;
    
    // Calculate distance
    const dx = playerPos.x - charPos.x;
    const dz = playerPos.z - charPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    return distance <= DIALOGUE_CONFIG.maxDistance;
}

/**
 * Start a dialogue with a character
 * @param {Object} character - The character to talk to
 */
export function startDialogue(character) {
    // Get game state
    const gameState = getGameState();
    
    // Check if dialogue is on cooldown
    if (gameState.dialogueCooldown) {
        logger.debug(`Dialogue on cooldown, can't start with ${character.id}`, 'DIALOGUE');
        return;
    }
    
    // Check if player is close enough
    if (!isPlayerCloseEnough(character)) {
        logger.debug(`Player too far from ${character.id} to start dialogue`, 'DIALOGUE');
        return;
    }
    
    // Check if character has dialogue data
    if (!dialogueData[character.id]) {
        logger.warn(`No dialogue data for character: ${character.id}`, 'DIALOGUE');
        return;
    }
    
    logger.info(`Starting dialogue with ${character.id}`, 'DIALOGUE');
    
    // Set dialogue active in game state
    setDialogueActive(true);
    setActiveCharacter(character);
    setDialogueCooldown(true, DIALOGUE_CONFIG.cooldownTime);
    
    // Set local dialogue state
    currentCharacter = character;
    currentDialogueStep = 'greeting';
    isInDialogue = true;
    
    // Play talking animation for character
    if (character.animations && character.animations.talking) {
        playAnimation(character, 'talking');
    }
    
    // Display first dialogue step
    displayDialogueStep();
    
    // Start speech recognition if enabled
    if (gameState.languageConfig?.speechEnabled) {
        startSpeechRecognition(processUserResponse);
    }
}

/**
 * Display the current dialogue step
 */
function displayDialogueStep() {
    if (!currentCharacter || !currentDialogueStep) {
        logger.error('Cannot display dialogue: missing character or step', 'DIALOGUE');
        return;
    }
    
    // Get dialogue data for current step
    const dialogue = dialogueData[currentCharacter.id][currentDialogueStep];
    if (!dialogue) {
        logger.error(`Dialogue step not found: ${currentDialogueStep} for ${currentCharacter.id}`, 'DIALOGUE');
        return;
    }
    
    logger.debug(`Displaying dialogue step: ${currentDialogueStep}`, 'DIALOGUE');
    
    // Create dialogue box if it doesn't exist
    if (!dialogueBox) {
        createDialogueBoxElement();
    }
    
    // Set character data
    dialogueBox.setAttribute('data-character', currentCharacter.id);
    
    // Update dialogue text
    const textElement = dialogueBox.querySelector('.dialogue-text');
    if (textElement) {
        textElement.textContent = dialogue.text;
    }
    
    // Clear existing options
    const optionsContainer = dialogueBox.querySelector('.dialogue-options');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        
        // Add new options
        if (dialogue.options && dialogue.options.length > 0) {
            dialogue.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'dialogue-option';
                optionElement.textContent = option.text;
                optionElement.setAttribute('data-index', index);
                optionElement.setAttribute('data-next', option.next);
                
                // Add click handler
                optionElement.addEventListener('click', () => {
                    goToDialogueStep(option.next);
                });
                
                optionsContainer.appendChild(optionElement);
            });
        } else {
            // If no options, auto-close dialogue after a delay
            setTimeout(() => {
                endDialogue();
            }, 3000);
        }
    }
    
    // Show dialogue box
    dialogueBox.style.display = 'block';
    dialogueBox.classList.remove('disappearing');
}

/**
 * Create the dialogue box element
 */
function createDialogueBoxElement() {
    // Get dialogue container
    const container = document.getElementById('dialogue-container');
    if (!container) {
        logger.error('Dialogue container not found in the DOM', 'DIALOGUE');
        return;
    }
    
    // Create dialogue box
    dialogueBox = document.createElement('div');
    dialogueBox.className = 'dialogue-box';
    dialogueBox.classList.add(currentCharacter.id);
    
    // Create dialogue text
    const textElement = document.createElement('div');
    textElement.className = 'dialogue-text';
    dialogueBox.appendChild(textElement);
    
    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'dialogue-options';
    dialogueBox.appendChild(optionsContainer);
    
    // Add to container
    container.appendChild(dialogueBox);
}

/**
 * Go to a specific dialogue step
 * @param {string} stepId - The ID of the dialogue step to go to
 */
function goToDialogueStep(stepId) {
    if (!dialogueData[currentCharacter.id][stepId]) {
        logger.error(`Invalid dialogue step: ${stepId}`, 'DIALOGUE');
        return;
    }
    
    // Update current step
    currentDialogueStep = stepId;
    
    // Display the new step
    displayDialogueStep();
    
    // If this is a special step that needs animation, handle it
    if (stepId === 'magic_trick' && currentCharacter.id === 'cat') {
        if (currentCharacter.animations && currentCharacter.animations.magic) {
            playAnimation(currentCharacter, 'magic', 0.3, () => {
                // After animation completes, go back to talking
                if (currentCharacter.animations.talking) {
                    playAnimation(currentCharacter, 'talking');
                }
            });
        }
    }
}

/**
 * Process user's spoken response
 * @param {string} transcript - The speech recognition transcript
 */
function processUserResponse(transcript) {
    if (!isInDialogue || !currentCharacter || !currentDialogueStep) {
        return;
    }
    
    logger.debug(`Processing user response: "${transcript}"`, 'DIALOGUE');
    
    // Get current dialogue options
    const dialogue = dialogueData[currentCharacter.id][currentDialogueStep];
    if (!dialogue || !dialogue.options || dialogue.options.length === 0) {
        return;
    }
    
    // Get option texts
    const options = dialogue.options.map(option => option.text);
    
    // Find best match
    const bestMatch = findBestMatch(transcript, options);
    
    // If good match found, go to next step
    if (bestMatch.score > 0.6) {
        const nextStep = dialogue.options[bestMatch.index].next;
        logger.debug(`Matched option: "${options[bestMatch.index]}" (score: ${bestMatch.score.toFixed(2)})`, 'DIALOGUE');
        goToDialogueStep(nextStep);
    } else {
        logger.debug('No good match found for speech input', 'DIALOGUE');
        // Optionally show feedback to user that speech wasn't recognized
    }
}

/**
 * End the current dialogue
 */
export function endDialogue() {
    if (!isInDialogue) return;
    
    logger.info('Ending dialogue', 'DIALOGUE');
    
    // Stop speech recognition
    stopSpeechRecognition();
    
    // Reset character animation to idle
    if (currentCharacter && currentCharacter.animations && currentCharacter.animations.idle) {
        playAnimation(currentCharacter, 'idle');
    }
    
    // Hide dialogue box with animation
    if (dialogueBox) {
        dialogueBox.classList.add('disappearing');
        setTimeout(() => {
            if (dialogueBox) {
                dialogueBox.style.display = 'none';
                dialogueBox.remove();
                dialogueBox = null;
            }
        }, 500);
    }
    
    // Reset dialogue state
    currentCharacter = null;
    currentDialogueStep = null;
    isInDialogue = false;
    
    // Update game state
    setDialogueActive(false);
    setActiveCharacter(null);
    
    // Set cooldown
    setDialogueCooldown(true, DIALOGUE_CONFIG.cooldownTime);
}

/**
 * Check if player has walked away from dialogue
 */
export function checkDialogueDistance() {
    if (!isInDialogue || !currentCharacter) return;
    
    // If player walks too far away, end dialogue
    if (!isPlayerCloseEnough(currentCharacter)) {
        logger.debug('Player walked away from dialogue', 'DIALOGUE');
        endDialogue();
    }
} 