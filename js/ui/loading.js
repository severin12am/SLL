import * as THREE from 'three';
import { logger } from '../utils/logger.js';

/**
 * Loading UI Module
 * Handles loading screen and progress indicators
 */

// Loading UI elements
let loadingScreen = null;
let progressBar = null;
let progressText = null;
let statusText = null;

/**
 * Initialize loading screen
 */
export function initLoadingScreen() {
    // Create loading screen if it doesn't exist
    if (!loadingScreen) {
        createLoadingScreen();
    }
    
    // Show loading screen
    showLoadingScreen();
    
    logger.info('Loading screen initialized', 'LOADING');
}

/**
 * Create loading screen elements
 */
function createLoadingScreen() {
    // Create container
    loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading-screen';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.backgroundColor = '#000';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.flexDirection = 'column';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.zIndex = '1000';
    loadingScreen.style.transition = 'opacity 0.5s ease';
    
    // Create title
    const title = document.createElement('h1');
    title.textContent = 'Loading Game';
    title.style.color = '#fff';
    title.style.marginBottom = '20px';
    title.style.fontFamily = 'Arial, sans-serif';
    loadingScreen.appendChild(title);
    
    // Create progress container
    const progressContainer = document.createElement('div');
    progressContainer.style.width = '80%';
    progressContainer.style.maxWidth = '500px';
    progressContainer.style.backgroundColor = '#333';
    progressContainer.style.borderRadius = '5px';
    progressContainer.style.overflow = 'hidden';
    progressContainer.style.marginBottom = '10px';
    loadingScreen.appendChild(progressContainer);
    
    // Create progress bar
    progressBar = document.createElement('div');
    progressBar.style.width = '0%';
    progressBar.style.height = '20px';
    progressBar.style.backgroundColor = '#4CAF50';
    progressBar.style.transition = 'width 0.3s ease';
    progressContainer.appendChild(progressBar);
    
    // Create progress text
    progressText = document.createElement('div');
    progressText.textContent = '0%';
    progressText.style.color = '#fff';
    progressText.style.marginBottom = '20px';
    progressText.style.fontFamily = 'Arial, sans-serif';
    loadingScreen.appendChild(progressText);
    
    // Create status text
    statusText = document.createElement('div');
    statusText.textContent = 'Initializing...';
    statusText.style.color = '#aaa';
    statusText.style.fontFamily = 'Arial, sans-serif';
    statusText.style.fontSize = '14px';
    loadingScreen.appendChild(statusText);
    
    // Add to document
    document.body.appendChild(loadingScreen);
}

/**
 * Create a THREE.LoadingManager with progress tracking
 * @returns {THREE.LoadingManager} Configured loading manager
 */
export function createLoadingManager() {
    // Make sure loading screen is initialized
    initLoadingScreen();
    
    // Create THREE.LoadingManager
    const loadingManager = new THREE.LoadingManager();
    
    // Set up callbacks
    loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
        logger.debug(`Started loading: ${url}`, 'LOADING');
        updateLoadingProgress(0, `Loading ${url}`);
    };
    
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        const progress = Math.round((itemsLoaded / itemsTotal) * 100);
        logger.debug(`Loading progress: ${progress}% (${itemsLoaded}/${itemsTotal})`, 'LOADING');
        updateLoadingProgress(progress, `Loading ${url}`);
    };
    
    loadingManager.onLoad = () => {
        logger.info('Loading complete', 'LOADING');
        updateLoadingProgress(100, 'Loading complete');
        
        // Hide loading screen after a short delay
        setTimeout(() => {
            hideLoadingScreen();
        }, 500);
    };
    
    loadingManager.onError = (url) => {
        logger.error(`Error loading: ${url}`, 'LOADING');
        updateLoadingProgress(0, `Error loading ${url}`);
        showLoadingError(new Error(`Failed to load ${url}`));
    };
    
    return loadingManager;
}

/**
 * Update loading progress
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} status - Status message
 */
export function updateLoadingProgress(progress, status) {
    // Make sure loading screen is initialized
    if (!loadingScreen) {
        initLoadingScreen();
    }
    
    // Update progress bar
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    // Update progress text
    if (progressText) {
        progressText.textContent = `${progress}%`;
    }
    
    // Update status text
    if (statusText && status) {
        statusText.textContent = status;
    }
}

/**
 * Show loading screen
 */
export function showLoadingScreen() {
    // Make sure loading screen is initialized
    if (!loadingScreen) {
        initLoadingScreen();
    }
    
    loadingScreen.style.display = 'flex';
    loadingScreen.style.opacity = '1';
}

/**
 * Hide loading screen
 */
export function hideLoadingScreen() {
    if (!loadingScreen) return;
    
    // Fade out loading screen
    loadingScreen.style.opacity = '0';
    
    // Remove from DOM after animation
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
    
    logger.info('Loading screen hidden', 'LOADING');
}

/**
 * Show error message
 * @param {Error} error - Error to display
 */
export function showLoadingError(error) {
    // Make sure loading screen is initialized
    if (!loadingScreen) {
        initLoadingScreen();
    }
    
    // Update status
    if (statusText) {
        statusText.textContent = `Error: ${error.message}`;
        statusText.style.color = '#ff5252';
    }
    
    // Change progress bar color
    if (progressBar) {
        progressBar.style.backgroundColor = '#ff5252';
    }
    
    logger.error(`Loading error: ${error.message}`, 'LOADING');
} 