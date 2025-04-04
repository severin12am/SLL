// Main entry point for the application
import * as THREE from 'three';
import { initScene, animate } from './scene/scene.js';
import { createLoadingManager, hideLoadingScreen, showLoadingError } from './ui/loading.js';
import { initGameState } from './game/game-manager.js';
import { setupEventListeners } from './input/input-manager.js';
import { initDebugUI } from './ui/debug.js';
import { DEBUG_CONFIG } from './config.js';
import { logger } from './utils/logger.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    logger.info('Application starting...', 'MAIN');
    
    try {
        // Create loading manager
        const loadingManager = createLoadingManager();
        
        // Initialize scene
        logger.info('Initializing 3D scene...', 'MAIN');
        const { scene, camera, renderer } = await initScene();
        
        // Initialize game state with scene data
        logger.info('Initializing game state...', 'MAIN');
        initGameState({ scene, camera, renderer });
        
        // Setup input event listeners
        logger.info('Setting up input handlers...', 'MAIN');
        setupEventListeners(camera);
        
        // Set up event listeners
        logger.info('Setting up UI event listeners...', 'MAIN');
        setupUIEventListeners();
        
        // Initialize debug UI if enabled
        if (DEBUG_CONFIG.showStats) {
            logger.info('Initializing debug UI...', 'MAIN');
            initDebugUI();
        }
        
        // Start animation loop
        logger.info('Starting animation loop...', 'MAIN');
        animate();
        
        // Set a timeout to force-hide the loading screen if it doesn't disappear
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen && loadingScreen.style.display !== 'none') {
                logger.warn('Loading screen timeout - forcing hide', 'MAIN');
                hideLoadingScreen();
            }
        }, 15000); // 15 seconds timeout
        
        logger.info('Application initialized successfully', 'MAIN');
    } catch (error) {
        logger.error(`Initialization failed: ${error.message}`, 'MAIN');
        console.error(error); // Log full error object for stack trace
        showLoadingError(error);
    }
});

/**
 * Set up UI event listeners
 */
function setupUIEventListeners() {
    // Add click event for game container to request pointer lock
    document.getElementById('container').addEventListener('click', () => {
        document.body.requestPointerLock();
    });
    
    // Start game button
    document.getElementById('start-game').addEventListener('click', () => {
        logger.info('Starting game...', 'UI');
        // Import game manager module dynamically to avoid circular dependencies
        import('./game/game-manager.js').then(({ startGame }) => {
            startGame();
        });
    });
    
    // Pause menu buttons
    document.getElementById('resume-button')?.addEventListener('click', () => {
        logger.debug('Resume button clicked', 'UI');
        import('./game/game-manager.js').then(({ togglePause }) => {
            togglePause();
        });
    });
    
    document.getElementById('restart-button')?.addEventListener('click', () => {
        logger.info('Restarting application...', 'UI');
        location.reload();
    });
    
    // Add ESC key listener for pause menu
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            logger.debug('ESC key pressed, toggling pause', 'UI');
            import('./game/game-manager.js').then(({ togglePause }) => {
                togglePause();
            });
        }
    });
    
    logger.debug('UI event listeners setup complete', 'UI');
} 