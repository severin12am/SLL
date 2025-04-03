import { getCharacter } from '../characters/character-loader.js';
import { playAnimation } from '../characters/animations.js';
import { startSpeechRecognition, stopSpeechRecognition } from './speech-recognition.js';
import { findBestMatch } from '../utils/text-matching.js';
import { speak } from './text-to-speech.js';
import { createDialogueBox, updateDialogueProgress } from '../ui/dialogue-ui.js';
import { getGameState, resetDialogue } from '../game/game-manager.js';

// Dialogue cooldown timer (ms)
const DIALOGUE_COOLDOWN = 1000;
let lastDialogueTime = 0;

// Default dialogue data structure
const dialogueData = {
    vendor: {
        initial: {
            text: "Hello! I'm the vendor. Would you like to learn about items?",
            options: [
                { text: "Yes, tell me about items", next: "about_items" },
                { text: "No thanks", next: "goodbye" }
            ]
        },
        about_items: {
            text: "I sell various magical items that can help you on your journey. Would you like to buy something?",
            options: [
                { text: "Show me what you have", next: "show_items" },
                { text: "Not right now", next: "goodbye" }
            ]
        },
        show_items: {
            text: "Here are my items: Healing Potion, Magic Scroll, Enchanted Sword. Which one interests you?",
            options: [
                { text: "Healing Potion", next: "healing_potion" },
                { text: "Magic Scroll", next: "magic_scroll" },
                { text: "Enchanted Sword", next: "enchanted_sword" },
                { text: "None of these", next: "goodbye" }
            ]
        },
        healing_potion: {
            text: "The Healing Potion restores your health. It costs 50 gold.",
            options: [
                { text: "I'll buy it", next: "buy_item" },
                { text: "Let me see something else", next: "show_items" },
                { text: "No thanks", next: "goodbye" }
            ]
        },
        magic_scroll: {
            text: "The Magic Scroll contains powerful spells. It costs 100 gold.",
            options: [
                { text: "I'll buy it", next: "buy_item" },
                { text: "Let me see something else", next: "show_items" },
                { text: "No thanks", next: "goodbye" }
            ]
        },
        enchanted_sword: {
            text: "The Enchanted Sword increases your attack power. It costs 200 gold.",
            options: [
                { text: "I'll buy it", next: "buy_item" },
                { text: "Let me see something else", next: "show_items" },
                { text: "No thanks", next: "goodbye" }
            ]
        },
        buy_item: {
            text: "Thank you for your purchase! Is there anything else you need?",
            options: [
                { text: "Yes, show me more items", next: "show_items" },
                { text: "No thanks", next: "goodbye" }
            ]
        },
        goodbye: {
            text: "Farewell! Come back anytime you need supplies.",
            options: []
        }
    },
    cat: {
        initial: {
            text: "Meow! I'm a magical cat that can talk. Do you like cats?",
            options: [
                { text: "Yes, I love cats", next: "like_cats" },
                { text: "No, I prefer dogs", next: "prefer_dogs" }
            ]
        },
        like_cats: {
            text: "Purr! You're my kind of person. Would you like to pet me?",
            options: [
                { text: "Yes, I'd love to", next: "pet_cat" },
                { text: "Not right now", next: "goodbye_cat" }
            ]
        },
        prefer_dogs: {
            text: "Hiss! Dogs are okay too, I guess. Did you know I can do magic tricks?",
            options: [
                { text: "Show me a trick", next: "magic_trick" },
                { text: "No thanks", next: "goodbye_cat" }
            ]
        },
        pet_cat: {
            text: "Purr! That feels wonderful. I can tell you a secret if you'd like.",
            options: [
                { text: "Tell me a secret", next: "tell_secret" },
                { text: "No thanks", next: "goodbye_cat" }
            ]
        },
        magic_trick: {
            text: "Abracadabra! *The cat disappears and reappears on your shoulder* Impressed?",
            options: [
                { text: "Very impressive!", next: "impressed" },
                { text: "Not really", next: "not_impressed" }
            ]
        },
        tell_secret: {
            text: "The secret treasure is buried under the old oak tree by the river. Don't tell anyone I told you!",
            options: [
                { text: "Thank you for the secret", next: "goodbye_cat" },
                { text: "Can you tell me more?", next: "no_more_secrets" }
            ]
        },
        impressed: {
            text: "Thank you! I've been practicing for years. Would you like to see another trick?",
            options: [
                { text: "Yes please", next: "magic_trick" },
                { text: "No thanks", next: "goodbye_cat" }
            ]
        },
        not_impressed: {
            text: "Well, you're hard to please! Maybe I'll just take a nap instead.",
            options: [
                { text: "Sorry, show me another trick", next: "magic_trick" },
                { text: "Bye then", next: "goodbye_cat" }
            ]
        },
        no_more_secrets: {
            text: "That's all the secrets I have for now. Come back tomorrow for more!",
            options: [
                { text: "I'll come back later", next: "goodbye_cat" }
            ]
        },
        goodbye_cat: {
            text: "Meow! See you later!",
            options: []
        }
    }
};

/**
 * Start dialogue with a character
 * @param {string} characterId - ID of the character to talk to
 */
export function startDialogue(characterId) {
    const gameState = getGameState();
    
    // Check cooldown to prevent rapid dialogue triggering
    const now = Date.now();
    if (now - lastDialogueTime < DIALOGUE_COOLDOWN) {
        console.log("Dialogue cooldown active");
        return;
    }
    lastDialogueTime = now;
    
    console.log(`Starting dialogue with ${characterId}`);
    
    // Get character data
    const character = getCharacter(characterId);
    if (!character) {
        console.error(`Character ${characterId} not found`);
        return;
    }
    
    // Reset any existing dialogue
    resetDialogue();
    
    // Set active character
    gameState.activeCharacter = character;
    gameState.hasStartedDialogue = true;
    gameState.currentStep = 'initial';
    
    // Get dialogue data for this character
    const charDialogue = dialogueData[characterId];
    if (!charDialogue) {
        console.error(`No dialogue data for ${characterId}`);
        return;
    }
    
    // Play talking animation for character
    if (character.animations && character.animations.talking) {
        playAnimation(character, 'talking');
    } else if (characterId === 'cat') {
        // Special case for cat's meow animation
        playAnimation(character, 'meow');
    }
    
    // Display initial dialogue
    displayDialogueStep(characterId, 'initial');
    
    // Start speech recognition
    startSpeechRecognition((result) => {
        // Process the spoken response
        processUserResponse(characterId, gameState.currentStep, result);
    });
}

/**
 * Display a dialogue step
 * @param {string} characterId - ID of the speaking character
 * @param {string} stepId - ID of the dialogue step
 */
function displayDialogueStep(characterId, stepId) {
    const charDialogue = dialogueData[characterId];
    if (!charDialogue || !charDialogue[stepId]) {
        console.error(`Dialogue step ${stepId} not found for ${characterId}`);
        return;
    }
    
    const step = charDialogue[stepId];
    const gameState = getGameState();
    
    // Create dialogue box if it doesn't exist yet
    if (!gameState.dialogueBoxes[characterId]) {
        gameState.dialogueBoxes[characterId] = createDialogueBox(characterId);
    }
    
    // Display the dialogue text
    const dialogueBox = gameState.dialogueBoxes[characterId];
    dialogueBox.setText(step.text);
    dialogueBox.setOptions(step.options);
    dialogueBox.show();
    
    // Use text-to-speech if available
    if (gameState.languageConfig.textToSpeech) {
        speak(step.text);
    }
    
    // Update current step
    gameState.currentStep = stepId;
    
    // If no options, auto-close dialogue after delay
    if (step.options.length === 0) {
        setTimeout(() => {
            endDialogue();
        }, 3000);
    }
}

/**
 * Process user's spoken response
 * @param {string} characterId - ID of the character in dialogue
 * @param {string} currentStep - Current dialogue step ID
 * @param {string} userResponse - User's spoken response
 */
function processUserResponse(characterId, currentStep, userResponse) {
    console.log(`Processing user response: "${userResponse}"`);
    
    const charDialogue = dialogueData[characterId];
    if (!charDialogue || !charDialogue[currentStep]) {
        console.error(`Dialogue step ${currentStep} not found for ${characterId}`);
        return;
    }
    
    const step = charDialogue[currentStep];
    
    // If no options, end dialogue
    if (!step.options || step.options.length === 0) {
        endDialogue();
        return;
    }
    
    // Extract option texts
    const optionTexts = step.options.map(opt => opt.text);
    
    // Find best match
    const bestMatch = findBestMatch(userResponse, optionTexts);
    console.log('Best match:', bestMatch);
    
    if (bestMatch && bestMatch.index !== -1) {
        // Get next step from matched option
        const nextStep = step.options[bestMatch.index].next;
        
        // Highlight the matched option
        updateDialogueProgress(characterId, bestMatch.index, bestMatch.text);
        
        // Wait a moment before showing next dialogue
        setTimeout(() => {
            // Navigate to next dialogue step
            displayDialogueStep(characterId, nextStep);
        }, 1000);
    } else {
        // No match found
        console.log('No match found for user response');
        // Could add a "I didn't understand" response here
    }
}

/**
 * End the current dialogue
 */
export function endDialogue() {
    stopSpeechRecognition();
    
    const gameState = getGameState();
    const character = gameState.activeCharacter;
    
    if (character) {
        // Reset to idle animation
        if (character.animations && character.animations.idle) {
            playAnimation(character, 'idle');
        }
    }
    
    // Hide all dialogue boxes
    Object.values(gameState.dialogueBoxes).forEach(box => {
        if (box && box.hide) box.hide();
    });
    
    // Reset dialogue state
    resetDialogue();
    
    console.log('Dialogue ended');
} 