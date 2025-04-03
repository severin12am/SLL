import { setupKeyboardControls } from './keyboard.js';
import { setupMouseControls } from './mouse.js';
import { setupTouchControls } from './touch.js';
import { INPUT_CONFIG } from '../config.js';
import { registerUpdateFunction } from '../scene/scene.js';
import { getGameState } from '../game/game-manager.js';

// Input state - local copy to avoid direct manipulation
const inputState = {
    // Movement keys
    keys: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        run: false,
        jump: false,
        interact: false
    },
    // Mouse state
    mouse: {
        x: 0,
        y: 0
    },
    // Look rotation
    yaw: 0,
    pitch: 0,
    // Touch tracking
    lastTouchX: null,
    lastTouchY: null,
    // Input enabled
    enabled: true,
    // Pointer lock state
    isPointerLocked: false
};

/**
 * Update the camera rotation based on input state
 * @param {THREE.Camera} camera - The camera to update
 */
function updateCamera(camera) {
    if (!camera) return;
    
    // Skip camera update if in dialogue
    const gameState = getGameState();
    if (gameState.isDialogueActive) return;
    
    // Apply rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = inputState.yaw;
    camera.rotation.x = inputState.pitch;
}

/**
 * Update the game manager with current input state
 */
function updateGameInput() {
    // Get game state
    const gameState = getGameState();
    if (!gameState) return;
    
    // Don't update input if disabled or in dialogue
    if (!inputState.enabled || gameState.isDialogueActive) return;
    
    // Update game input state with our local input state
    gameState.input.forward = inputState.keys.forward;
    gameState.input.backward = inputState.keys.backward;
    gameState.input.left = inputState.keys.left;
    gameState.input.right = inputState.keys.right;
    gameState.input.run = inputState.keys.run;
    gameState.input.jump = inputState.keys.jump;
    gameState.input.interact = inputState.keys.interact;
}

/**
 * Set up all input event listeners
 * @param {THREE.Camera} camera - The camera to control
 */
export function setupEventListeners(camera) {
    console.log('Initializing input controllers...');
    
    // Set up keyboard controls
    setupKeyboardControls(inputState, INPUT_CONFIG);
    
    // Set up mouse controls
    setupMouseControls(inputState, () => updateCamera(camera));
    
    // Set up touch controls if enabled in config
    if (INPUT_CONFIG.touchControls) {
        setupTouchControls(inputState);
    }
    
    // Register camera update function
    registerUpdateFunction(() => updateCamera(camera));
    
    // Register input state update
    registerUpdateFunction(updateGameInput);
    
    console.log('Input controls initialized');
}

/**
 * Enable or disable input
 * @param {boolean} enabled - Whether input should be enabled
 */
export function setInputEnabled(enabled) {
    inputState.enabled = enabled;
    
    // Reset all keys if disabling
    if (!enabled) {
        inputState.keys.forward = false;
        inputState.keys.backward = false;
        inputState.keys.left = false;
        inputState.keys.right = false;
        inputState.keys.run = false;
        inputState.keys.jump = false;
        inputState.keys.interact = false;
    }
}

/**
 * Reset input state
 */
export function resetInput() {
    inputState.keys.forward = false;
    inputState.keys.backward = false;
    inputState.keys.left = false;
    inputState.keys.right = false;
    inputState.keys.run = false;
    inputState.keys.jump = false;
    inputState.keys.interact = false;
    
    // Also update game state
    updateGameInput();
} 