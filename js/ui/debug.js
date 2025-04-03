/**
 * Debug UI Module
 * Provides visual debugging information for development
 */

import { getGameState } from '../game/game-manager.js';
import { DEBUG_CONFIG } from '../config.js';

let debugContainer = null;
let fpsCounter = null;
let frameCount = 0;
let lastTime = 0;
let isEnabled = true;

/**
 * Initialize the debug UI
 */
export function initDebugUI() {
    if (!DEBUG_CONFIG.showStats) {
        isEnabled = false;
        return;
    }

    // Create main container
    debugContainer = document.createElement('div');
    debugContainer.className = 'debug-container';
    debugContainer.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 1000;
        min-width: 200px;
        pointer-events: none;
    `;
    
    // Add FPS counter
    fpsCounter = document.createElement('div');
    fpsCounter.className = 'debug-fps';
    debugContainer.appendChild(fpsCounter);
    
    // Add game state info
    const gameStateInfo = document.createElement('div');
    gameStateInfo.className = 'debug-game-state';
    debugContainer.appendChild(gameStateInfo);
    
    // Add player position info
    const playerInfo = document.createElement('div');
    playerInfo.className = 'debug-player-info';
    debugContainer.appendChild(playerInfo);
    
    // Add to document
    document.body.appendChild(debugContainer);
    
    // Set up update cycle
    requestAnimationFrame(updateDebugUI);
    
    // Add toggle key
    document.addEventListener('keydown', (e) => {
        if (e.key === '`' || e.key === 'Backquote') {
            toggleDebugUI();
        }
    });
    
    console.log('Debug UI initialized');
}

/**
 * Toggle debug UI visibility
 */
export function toggleDebugUI() {
    if (!debugContainer) return;
    
    isEnabled = !isEnabled;
    debugContainer.style.display = isEnabled ? 'block' : 'none';
}

/**
 * Update the debug UI
 * @param {number} time - Current timestamp
 */
function updateDebugUI(time) {
    if (!isEnabled || !debugContainer) {
        requestAnimationFrame(updateDebugUI);
        return;
    }
    
    // Update frame count
    frameCount++;
    
    // Calculate FPS every second
    if (time - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (time - lastTime));
        fpsCounter.textContent = `FPS: ${fps}`;
        frameCount = 0;
        lastTime = time;
    }
    
    // Get game state
    const gameState = getGameState();
    if (gameState) {
        // Update game state info
        const gameStateInfo = debugContainer.querySelector('.debug-game-state');
        if (gameStateInfo) {
            gameStateInfo.innerHTML = `
                <div>Initialized: ${gameState.initialized}</div>
                <div>Loading: ${gameState.isLoading}</div>
                <div>Paused: ${gameState.isPaused}</div>
                <div>Dialogue: ${gameState.isDialogueActive}</div>
                <div>Characters: ${Object.keys(gameState.characters).length}</div>
            `;
        }
        
        // Update player info
        const player = gameState.player;
        const playerInfo = debugContainer.querySelector('.debug-player-info');
        if (playerInfo && player) {
            playerInfo.innerHTML = `
                <div>Position: ${vectorToString(player.position)}</div>
                <div>Rotation: ${vectorToString(player.rotation)}</div>
                <div>Animation: ${player.currentAnimation || 'none'}</div>
                <div>Input: ${inputToString(gameState.input)}</div>
            `;
        }
    }
    
    // Continue update cycle
    requestAnimationFrame(updateDebugUI);
}

/**
 * Convert a vector to a string representation
 * @param {THREE.Vector3} vector - The vector to convert
 * @returns {string} String representation of the vector
 */
function vectorToString(vector) {
    if (!vector) return 'none';
    return `X:${vector.x.toFixed(2)} Y:${vector.y.toFixed(2)} Z:${vector.z.toFixed(2)}`;
}

/**
 * Convert input state to string
 * @param {Object} input - Input state object
 * @returns {string} String representation of input state
 */
function inputToString(input) {
    if (!input) return 'none';
    
    let result = '';
    if (input.forward) result += 'F';
    if (input.backward) result += 'B';
    if (input.left) result += 'L';
    if (input.right) result += 'R';
    if (input.jump) result += 'J';
    if (input.interact) result += 'I';
    
    return result || 'none';
} 