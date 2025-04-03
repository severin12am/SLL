// Main entry point for the application
import { initScene, animate } from './scene/scene.js';
import { setupEventListeners } from './input/input-manager.js';
import { startGame } from './game/game-manager.js';
import { createLoadingScreen } from './ui/loading.js';
import { MAP_BOUNDARIES, DIALOGUE_DISTANCE } from './config.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing application...');
    
    // Set up loading screen
    const loadingScreen = createLoadingScreen();
    document.body.appendChild(loadingScreen);
    
    try {
        // Initialize scene
        const { scene, camera, renderer } = await initScene();
        
        // Setup input event listeners
        setupEventListeners(camera);
        
        // Add click event for game container to request pointer lock
        document.getElementById('container').addEventListener('click', () => {
            document.body.requestPointerLock();
        });
        
        // Add start game event listener
        document.getElementById('start-game').addEventListener('click', startGame);
        
        // Start animation loop
        animate();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        document.getElementById('loading-screen').innerHTML = `
            <div style="color: white; text-align: center;">
                <h2>Error Initializing Application</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">Reload</button>
            </div>
        `;
    }
}); 