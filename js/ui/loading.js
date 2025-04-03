import * as THREE from 'three';

/**
 * Loading screen module
 * Handles the display and updating of the loading screen
 */

// Get loading screen elements
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.getElementById('progress');
const loadingStatus = document.getElementById('loading-status');

// Total number of assets to load
let totalAssets = 0;
let loadedAssets = 0;

/**
 * Initialize the loading system with a total number of assets
 * @param {number} total - Total number of assets to load
 */
export function initLoading(total) {
    totalAssets = total;
    loadedAssets = 0;
    updateProgress(0, 'Initializing...');
    
    // Make sure loading screen is visible
    showLoadingScreen();
}

/**
 * Update the loading progress
 * @param {number} increment - Number of assets to increment (default: 1)
 * @param {string} status - Status message to display
 */
export function updateProgress(increment = 1, status = '') {
    loadedAssets += increment;
    
    // Calculate percentage
    const percentage = Math.min(Math.round((loadedAssets / totalAssets) * 100), 100);
    
    // Update progress bar
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    // Update status text if provided
    if (status && loadingStatus) {
        loadingStatus.textContent = status;
    }
    
    // Log progress
    console.log(`Loading progress: ${percentage}% (${loadedAssets}/${totalAssets})`);
}

/**
 * Show the loading screen
 */
export function showLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

/**
 * Hide the loading screen with a fade out animation
 */
export function hideLoadingScreen() {
    if (loadingScreen) {
        // Animate fade out
        loadingScreen.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            loadingScreen.style.opacity = '1'; // Reset for next time
        }, 1000);
    }
}

/**
 * Create a loading manager for Three.js
 * @returns {THREE.LoadingManager} Configured loading manager
 */
export function createLoadingManager() {
    const manager = new THREE.LoadingManager();
    
    manager.onStart = function(url, itemsLoaded, itemsTotal) {
        console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        initLoading(itemsTotal);
    };
    
    manager.onLoad = function() {
        console.log('Loading complete!');
        hideLoadingScreen();
    };
    
    manager.onProgress = function(url, itemsLoaded, itemsTotal) {
        console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        updateProgress(1, `Loading: ${url.split('/').pop()}`);
    };
    
    manager.onError = function(url) {
        console.error('Error loading: ' + url);
        loadingStatus.textContent = `Error loading: ${url}`;
        loadingStatus.style.color = 'red';
    };
    
    return manager;
}

/**
 * Display an error message in the loading screen
 * @param {Error} error - Error object
 */
export function showLoadingError(error) {
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div style="color: white; text-align: center; padding: 20px;">
                <h2>Error Loading Game</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" 
                        style="padding: 10px 20px; background: #4CAF50; 
                               color: white; border: none; margin-top: 20px; 
                               cursor: pointer; border-radius: 5px;">
                    Reload
                </button>
            </div>
        `;
    }
}

/**
 * Create the loading screen element
 * @returns {HTMLElement} The loading screen element
 */
export function createLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    
    const loadingText = document.createElement('h2');
    loadingText.id = 'loading-text';
    loadingText.textContent = 'Loading...';
    loadingText.style.color = 'white';
    loadingText.style.marginBottom = '20px';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    
    const progressFill = document.createElement('div');
    progressFill.id = 'progress-fill';
    
    progressBar.appendChild(progressFill);
    loadingScreen.appendChild(loadingText);
    loadingScreen.appendChild(progressBar);
    
    // Set transition for fade out
    loadingScreen.style.transition = 'opacity 0.5s ease';
    
    return loadingScreen;
}

// Create and export a default loading manager
export const loadingManager = createLoadingManager(); 