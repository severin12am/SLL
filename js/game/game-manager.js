/**
 * Game Manager Module
 * Central system for managing game state and coordinating subsystems
 */

import { loadCharacters, updateCharacters, getCharacter, getAllCharacters } from '../characters/character-loader.js';
import { updatePlayerMovement } from '../characters/player.js';
import { startDialogue, endDialogue, checkDialogueDistance } from '../dialogue/dialogue-system.js';
import { setInputEnabled } from '../input/input-manager.js';
import { initDialogueUI } from '../ui/dialogue-ui.js';
import { logger } from '../utils/logger.js';
import { DEFAULT_LANGUAGE_CONFIG } from '../config.js';
import { waitForVoices } from '../dialogue/text-to-speech.js';

// Game state
const gameState = {
    // Scene references
    scene: null,
    camera: null,
    renderer: null,
    
    // Game status
    initialized: false,
    isLoading: true,
    isPaused: false,
    
    // Character tracking
    player: null,
    characters: {},
    activeCharacter: null,
    
    // Dialogue state
    isDialogueActive: false,
    dialogueCooldown: false,
    dialogueOptions: [],
    
    // Input state
    input: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        run: false,
        jump: false,
        interact: false
    },
    
    // Language configuration
    languageConfig: { ...DEFAULT_LANGUAGE_CONFIG }
};

/**
 * Initialize the game state with scene data
 * @param {Object} sceneData - Object containing scene, camera, renderer
 */
export function initGameState(sceneData) {
    // Store scene references
    gameState.scene = sceneData.scene;
    gameState.camera = sceneData.camera;
    gameState.renderer = sceneData.renderer;
    
    // Initialize UI
    initDialogueUI();
    
    // Initialize voices for text-to-speech
    initVoices();
    
    // Mark as initialized
    gameState.initialized = true;
    
    logger.info('Game state initialized', 'GAME');
    
    return gameState;
}

/**
 * Initialize voices for text-to-speech
 */
async function initVoices() {
    try {
        const voices = await waitForVoices();
        logger.info(`Loaded ${voices.length} voices for speech synthesis`, 'GAME');
    } catch (error) {
        logger.warn('Error loading voices: ' + error.message, 'GAME');
    }
}

/**
 * Start the game
 */
export function startGame() {
    if (gameState.isLoading) {
        logger.info('Starting game...', 'GAME');
        
        // Hide language selection menu
        const languageSelection = document.getElementById('language-selection');
        if (languageSelection) {
            languageSelection.style.display = 'none';
        }
        
        // Load characters
        loadCharacters()
            .then(characters => {
                // Store player reference
                gameState.player = getCharacter('player');
                
                // Store all characters
                const allCharacters = getAllCharacters();
                gameState.characters = allCharacters;
                
                // Register update functions
                registerUpdate(updateGame);
                
                // Hide loading screen
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
                
                // Game ready
                gameState.isLoading = false;
                logger.info('Game started successfully', 'GAME');
            })
            .catch(error => {
                logger.error('Error starting game: ' + error.message, 'GAME');
                console.error(error);
                
                // Still hide loading screen on error
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
            });
    }
}

/**
 * Register a function to update on each frame
 * @param {Function} updateFunction - Function to call each frame
 */
function registerUpdate(updateFunction) {
    // The scene module handles registering the update function
    if (window.registerUpdateFunction) {
        window.registerUpdateFunction(updateFunction);
    } else {
        logger.warn('registerUpdateFunction not available in global scope', 'GAME');
    }
}

/**
 * Main game update function (called each frame)
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updateGame(deltaTime) {
    // Skip if game is paused
    if (gameState.isPaused) return;
    
    // Update characters
    updateCharacters(deltaTime);
    
    // Update player movement if not in dialogue
    if (gameState.player && !gameState.isDialogueActive) {
        updatePlayerMovement(gameState.player, gameState.input, deltaTime);
    }
    
    // Check for interactions
    checkInteractions();
    
    // Check if player walked away from dialogue
    if (gameState.isDialogueActive) {
        checkDialogueDistance();
    }
}

/**
 * Check for player interactions with characters
 */
function checkInteractions() {
    // Skip if in dialogue
    if (gameState.isDialogueActive) return;
    
    // Check for interact key press
    if (gameState.input.interact) {
        // Reset input to prevent repeated interactions
        gameState.input.interact = false;
        
        // Find nearest character for interaction
        const player = gameState.player;
        if (!player) return;
        
        // Check each character
        for (const [id, character] of Object.entries(gameState.characters)) {
            if (id !== 'player' && character && character.isInteractive) {
                // Calculate distance
                const distance = player.position.distanceTo(character.position);
                
                // If close enough, interact
                if (distance <= 2.0) {
                    logger.info(`Interacting with ${id}`, 'GAME');
                    startDialogue(character);
                    break;
                }
            }
        }
    }
}

/**
 * Toggle game pause state
 */
export function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    // Update UI
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.style.display = gameState.isPaused ? 'flex' : 'none';
    }
    
    // Disable input during pause
    setInputEnabled(!gameState.isPaused);
    
    // If resuming while in dialogue, make sure dialogue ends
    if (!gameState.isPaused && gameState.isDialogueActive) {
        endDialogue();
    }
    
    logger.info(`Game ${gameState.isPaused ? 'paused' : 'resumed'}`, 'GAME');
}

/**
 * Set dialogue active state
 * @param {boolean} active - Whether dialogue is active
 */
export function setDialogueActive(active) {
    gameState.isDialogueActive = active;
    
    // Disable player movement during dialogue
    if (active) {
        setInputEnabled(false);
    } else {
        setInputEnabled(true);
    }
}

/**
 * Set active character for dialogue
 * @param {Object} character - The character object
 */
export function setActiveCharacter(character) {
    gameState.activeCharacter = character;
}

/**
 * Set dialogue cooldown
 * @param {boolean} active - Whether cooldown is active
 * @param {number} time - Cooldown time in ms
 */
export function setDialogueCooldown(active, time = 1000) {
    gameState.dialogueCooldown = active;
    
    if (active && time > 0) {
        setTimeout(() => {
            gameState.dialogueCooldown = false;
        }, time);
    }
}

/**
 * Register a character with the game manager
 * @param {string} id - Character ID
 * @param {Object} character - Character object
 */
export function registerCharacter(id, character) {
    gameState.characters[id] = character;
    logger.debug(`Character registered: ${id}`, 'GAME');
}

/**
 * Reset dialogue state
 * Clears active dialogue data and resets dialogue-related state
 */
export function resetDialogue() {
    gameState.isDialogueActive = false;
    gameState.activeCharacter = null;
    gameState.dialogueOptions = [];
    
    // Re-enable input after dialogue ends
    setInputEnabled(true);
    
    logger.debug('Dialogue state reset', 'GAME');
}

/**
 * Get the current game state
 * @returns {Object} Current game state
 */
export function getGameState() {
    return gameState;
} 