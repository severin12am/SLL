import { getScene, getCamera, registerUpdateFunction } from '../scene/scene.js';
import { loadPlayer } from '../characters/player.js';
import { loadCharacters } from '../characters/character-loader.js';
import { initSpeechRecognition } from '../dialogue/speech-recognition.js';
import { DEFAULT_LANGUAGE_CONFIG } from '../config.js';

/**
 * Game Manager Module
 * Controls the game state, settings, and core functionality
 */

// Global game state
const gameState = {
    initialized: false,
    isLoading: true,
    isPaused: false,
    isDialogueActive: false,
    
    // Game objects
    scene: null,
    camera: null,
    renderer: null,
    
    // Player info
    player: null,
    characters: {},
    activeCharacter: null,
    
    // Input state
    input: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        interact: false
    },
    
    // Game settings
    settings: {
        soundEnabled: true,
        musicVolume: 0.5,
        sfxVolume: 0.7,
        dialogueSpeed: 1.0,
        cameraSensitivity: 1.0
    },
    
    // Language settings
    languageConfig: {
        current: 'en',
        recognitionLang: 'en-US',
        speechEnabled: true
    },
    
    // Dialogue state
    dialogueCooldown: false,
    currentStep: null,
    dialogueHistory: []
};

/**
 * Initialize the game state
 * @param {Object} config - Initial configuration
 */
export function initGameState(config = {}) {
    // Apply configuration if provided
    if (config.scene) gameState.scene = config.scene;
    if (config.camera) gameState.camera = config.camera;
    if (config.renderer) gameState.renderer = config.renderer;
    
    // Set up input event listeners
    setupInputHandlers();
    
    // Mark as initialized
    gameState.initialized = true;
    gameState.isLoading = false;
    
    console.log('Game state initialized');
    
    return gameState;
}

/**
 * Set up input event handlers
 */
function setupInputHandlers() {
    // Keyboard event handlers
    document.addEventListener('keydown', (event) => {
        updateInputState(event, true);
    });
    
    document.addEventListener('keyup', (event) => {
        updateInputState(event, false);
    });
    
    // Touch controls - add if needed
}

/**
 * Update input state based on key events
 * @param {KeyboardEvent} event - Keyboard event
 * @param {boolean} isPressed - Whether key is pressed (true) or released (false)
 */
function updateInputState(event, isPressed) {
    // Skip if in dialogue mode
    if (gameState.isDialogueActive && !event.key === 'Escape') {
        return;
    }
    
    // Update based on key
    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            gameState.input.forward = isPressed;
            break;
        case 's':
        case 'arrowdown':
            gameState.input.backward = isPressed;
            break;
        case 'a':
        case 'arrowleft':
            gameState.input.left = isPressed;
            break;
        case 'd':
        case 'arrowright':
            gameState.input.right = isPressed;
            break;
        case ' ':
            gameState.input.jump = isPressed;
            break;
        case 'e':
        case 'enter':
            gameState.input.interact = isPressed;
            break;
        case 'escape':
            if (isPressed) {
                togglePause();
            }
            break;
    }
}

/**
 * Toggle game pause state
 */
export function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    // Show/hide pause menu
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.style.display = gameState.isPaused ? 'flex' : 'none';
    }
    
    console.log(`Game ${gameState.isPaused ? 'paused' : 'resumed'}`);
}

/**
 * Register a character with the game state
 * @param {string} id - Character ID
 * @param {Object} character - Character object
 */
export function registerCharacter(id, character) {
    gameState.characters[id] = character;
    
    if (id === 'player') {
        gameState.player = character;
    }
    
    console.log(`Character registered: ${id}`);
}

/**
 * Get a character by ID
 * @param {string} id - Character ID
 * @returns {Object|null} Character object or null if not found
 */
export function getCharacter(id) {
    return gameState.characters[id] || null;
}

/**
 * Set active character for dialogue
 * @param {string|Object} character - Character ID or object
 */
export function setActiveCharacter(character) {
    if (typeof character === 'string') {
        gameState.activeCharacter = gameState.characters[character] || null;
    } else {
        gameState.activeCharacter = character;
    }
    
    console.log(`Active character set: ${gameState.activeCharacter?.id || 'none'}`);
}

/**
 * Get the current game state
 * @returns {Object} Current game state
 */
export function getGameState() {
    return gameState;
}

/**
 * Set dialogue active state
 * @param {boolean} isActive - Whether dialogue is active
 */
export function setDialogueActive(isActive) {
    gameState.isDialogueActive = isActive;
    
    // Disable player movement during dialogue
    if (isActive) {
        resetInputState();
    }
}

/**
 * Reset input state
 */
export function resetInputState() {
    gameState.input.forward = false;
    gameState.input.backward = false;
    gameState.input.left = false;
    gameState.input.right = false;
    gameState.input.jump = false;
    gameState.input.interact = false;
}

/**
 * Set dialogue cooldown
 * @param {boolean} value - Cooldown state
 * @param {number} duration - Cooldown duration in ms
 */
export function setDialogueCooldown(value, duration = 2000) {
    gameState.dialogueCooldown = value;
    
    if (value && duration > 0) {
        setTimeout(() => {
            gameState.dialogueCooldown = false;
        }, duration);
    }
}

/**
 * Set current dialogue step
 * @param {Object} step - Current dialogue step
 */
export function setCurrentDialogueStep(step) {
    gameState.currentStep = step;
    
    // Add to history if it's a new step
    if (step) {
        gameState.dialogueHistory.push({
            characterId: gameState.activeCharacter?.id,
            text: step.text,
            timestamp: Date.now()
        });
    }
}

/**
 * Update game settings
 * @param {Object} newSettings - New settings to apply
 */
export function updateSettings(newSettings) {
    gameState.settings = {
        ...gameState.settings,
        ...newSettings
    };
    
    console.log('Game settings updated');
}

/**
 * Initialize the game
 * @returns {Promise<void>}
 */
async function initGame() {
    try {
        // Get scene
        const scene = getScene();
        
        // Load player character
        await loadPlayer(scene);
        
        // Load other characters
        await loadCharacters(scene);
        
        // Initialize speech recognition
        initSpeechRecognition();
        
        console.log('Game initialized');
        gameState.isGameStarted = true;
    } catch (error) {
        console.error('Error initializing game:', error);
        throw error;
    }
}

/**
 * Start the game with selected languages
 */
export function startGame() {
    // Get selected languages
    const motherLanguageSelect = document.getElementById('mother-language');
    const newLanguageSelect = document.getElementById('new-language');
    
    gameState.languageConfig.motherLanguage = motherLanguageSelect.value;
    gameState.languageConfig.newLanguage = newLanguageSelect.value;
    
    // Validate language selection
    if (gameState.languageConfig.motherLanguage === gameState.languageConfig.newLanguage) {
        alert('Please select different languages for learning');
        return;
    }
    
    console.log('Starting game with languages:', gameState.languageConfig);
    
    // Hide language selection
    document.getElementById('language-selection').style.display = 'none';
    
    // Initialize the game
    initGame()
        .then(() => {
            console.log('Game started successfully');
        })
        .catch(error => {
            console.error('Failed to start game:', error);
            alert(`Failed to start game: ${error.message}`);
        });
}

/**
 * Reset the dialogue state
 */
export function resetDialogue() {
    console.log('Resetting dialogue');
    
    // Clear dialogue boxes with animation
    gameState.dialogueBoxes.forEach(box => {
        box.classList.add('disappearing');
        setTimeout(() => box.remove(), 500);
    });
    
    // Reset state
    gameState.dialogueBoxes = [];
    gameState.hasStartedDialogue = false;
    gameState.activeCharacter = null;
    gameState.currentStep = 0;
}

/**
 * Reset the dialogue state
 */
export function resetDialogue() {
    console.log('Resetting dialogue');
    
    // Clear dialogue boxes with animation
    gameState.dialogueBoxes.forEach(box => {
        box.classList.add('disappearing');
        setTimeout(() => box.remove(), 500);
    });
    
    // Reset state
    gameState.dialogueBoxes = [];
    gameState.hasStartedDialogue = false;
    gameState.activeCharacter = null;
    gameState.currentStep = 0;
} 