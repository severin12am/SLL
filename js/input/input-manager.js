import { setupKeyboardControls } from './keyboard.js';
import { setupMouseControls } from './mouse.js';
import { setupTouchControls } from './touch.js';
import { isMobile } from '../config.js';
import { registerUpdateFunction } from '../scene/scene.js';

// Input state
export const inputState = {
    // Movement keys
    keys: {
        forward: false,
        backward: false,
        left: false,
        right: false
    },
    // Look rotation
    yaw: 0,
    pitch: 0,
    // Touch tracking
    lastTouchX: null,
    lastTouchY: null
};

/**
 * Update the camera rotation based on input state
 * @param {THREE.Camera} camera - The camera to update
 */
export function updateCamera(camera) {
    if (!camera) return;
    
    camera.rotation.order = 'YXZ';
    camera.rotation.y = inputState.yaw;
    camera.rotation.x = inputState.pitch;
}

/**
 * Set up all input event listeners
 * @param {THREE.Camera} camera - The camera to control
 */
export function setupEventListeners(camera) {
    // Set up keyboard controls
    setupKeyboardControls(inputState);
    
    // Set up mouse controls
    setupMouseControls(inputState, camera);
    
    // Set up touch controls (for mobile)
    if (isMobile) {
        setupTouchControls(inputState);
    }
    
    // Register camera update function
    registerUpdateFunction(() => updateCamera(camera));
    
    console.log('Input controls initialized');
} 