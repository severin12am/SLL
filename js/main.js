// Main entry point for the application
import * as THREE from 'three';
import { initScene, animate, getScene, getCamera, getRenderer } from './scene/scene.js';
import { createLoadingManager, hideLoadingScreen, showLoadingError, updateLoadingProgress } from './ui/loading.js';
import { initGameState } from './game/game-manager.js';
import { setupEventListeners } from './input/input-manager.js';
import { initDebugUI } from './ui/debug.js';
import { DEBUG_CONFIG } from './config.js';
import { logger } from './utils/logger.js';
import { initializeDialogue } from './dialogue.js';

// Make THREE globally available
window.THREE = THREE;

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
        
        // Load Tokyo map
        logger.info('Loading Tokyo map...', 'MAIN');
        try {
            await loadTokyoMap(scene, camera, renderer);
            logger.info('Tokyo map loaded successfully', 'MAIN');
        } catch (error) {
            logger.error(`Failed to load Tokyo map: ${error.message}`, 'MAIN');
            // Continue with the game even if Tokyo map loading fails
        }
        
        // Initialize movement system if it exists (from index.html)
        if (typeof window.setupMovementSystem === 'function') {
            logger.info('Setting up movement system from main.js', 'MAIN');
            window.setupMovementSystem();
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
 * Load the Tokyo map and set up the environment
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.Camera} camera - The camera
 * @param {THREE.WebGLRenderer} renderer - The renderer
 * @returns {Promise} - Resolves when the map is loaded
 */
async function loadTokyoMap(scene, camera, renderer) {
    return new Promise((resolve, reject) => {
        logger.info('Starting Tokyo map loading...', 'MAP');
        
        // Set loading status
        const loadingStatus = document.getElementById('loading-status');
        if (loadingStatus) {
            loadingStatus.textContent = 'Loading Tokyo map...';
        }
        
        // Import needed modules
        Promise.all([
            import('three/addons/loaders/GLTFLoader.js'),
            import('three/addons/loaders/DRACOLoader.js'),
            import('three/addons/environments/RoomEnvironment.js')
        ]).then(([GLTFLoaderModule, DRACOLoaderModule, RoomEnvironmentModule]) => {
            const { GLTFLoader } = GLTFLoaderModule;
            const { DRACOLoader } = DRACOLoaderModule;
            const { RoomEnvironment } = RoomEnvironmentModule;
            
            logger.debug('Map loader modules loaded', 'MAP');
            
            // Setup model loaders
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('./jsm/libs/draco/gltf/');
            
            const loader = new GLTFLoader();
            loader.setDRACOLoader(dracoLoader);
            
            // Load the Tokyo model
            loader.load('./models/gltf/LittlestTokyo.glb', 
                // Success callback
                (gltf) => {
                    logger.info('Tokyo model loaded successfully', 'MAP');
                    
                    // Setup and add model
                    const model = gltf.scene;
                    model.position.set(0, 4.5, 0);  // Raise the model up by 2 units
                    model.scale.set(0.02, 0.02, 0.02);  // Slightly larger scale for better visibility
                    scene.add(model);
                    
                    // Setup animation mixer
                    const mixer = new THREE.AnimationMixer(model);
                    if (gltf.animations && gltf.animations.length > 0) {
                        mixer.clipAction(gltf.animations[0]).play();
                    }
                    
                    // Register animation update
                    import('./scene/scene.js').then(({ registerUpdateFunction }) => {
                        registerUpdateFunction((delta) => {
                            mixer.update(delta);
                        });
                    });
                    
                    // Initialize global game state if not exists
                    if (!window.gameState) {
                        window.gameState = {
                            scene: scene,
                            camera: camera,
                            renderer: renderer,
                            input: {
                                forward: false,
                                backward: false,
                                left: false,
                                right: false,
                                run: false
                            },
                            characters: {}
                        };
                    } else {
                        // Make sure scene and camera references are updated in gameState
                        window.gameState.scene = scene;
                        window.gameState.camera = camera;
                        window.gameState.renderer = renderer;
                    }
                    
                    // Create a simple player object if not already defined
                    if (!window.gameState.player) {
                        // Create player at position
                        const playerPosition = new THREE.Vector3(2.8, 1.5, -1.9);  // Position player slightly above street level
                        window.gameState.player = {
                            id: 'player',
                            position: playerPosition,
                            model: {
                                position: playerPosition.clone()
                            }
                        };
                        
                        // Store in characters collection too
                        window.gameState.characters.player = window.gameState.player;
                        
                        logger.info('Created basic player character for navigation', 'MAP');
                    }
                    
                    // Set initial camera position to a good viewing position
                    camera.position.copy(window.gameState.player.position);
                    
                    // Make sure THREE is in the global scope for movement
                    if (typeof window.THREE === 'undefined') {
                        window.THREE = THREE;
                        logger.info('THREE added to window scope for movement system', 'MAP');
                    }
                    
                    // Make sure the movement system is initialized if it exists
                    if (typeof window.setupMovementSystem === 'function' && typeof window.movePlayerDirectly === 'undefined') {
                        window.setupMovementSystem();
                        logger.info('Movement system initialized from map loading', 'MAP');
                    }
                    
                    // Hide loading screen
                    hideLoadingScreen();
                    
                    // Log that player is ready
                    logger.info('Player ready at position:', 'MAP');
                    console.log(window.gameState.player.position);
                    
                    resolve(model);
                },
                // Progress callback
                (xhr) => {
                    const percentComplete = (xhr.loaded / xhr.total) * 100;
                    logger.debug(`Tokyo map loading: ${Math.round(percentComplete)}%`, 'MAP');
                    
                    // Update loading progress
                    if (loadingStatus) {
                        loadingStatus.textContent = `Loading Tokyo map... ${Math.round(percentComplete)}%`;
                    }
                    updateLoadingProgress(percentComplete);
                },
                // Error callback
                (error) => {
                    logger.error(`Error loading Tokyo model: ${error.message}`, 'MAP');
                    reject(error);
                }
            );
        }).catch(error => {
            logger.error(`Error loading map modules: ${error.message}`, 'MAP');
            reject(error);
        });
    });
}

/**
 * Set up UI event listeners
 */
function setupUIEventListeners() {
    // Add click event for game container to request pointer lock
    document.getElementById('container')?.addEventListener('click', () => {
        document.body.requestPointerLock();
    });
    
    // Start game button
    document.getElementById('start-game')?.addEventListener('click', () => {
        logger.info('Starting game...', 'UI');
        // Start the game function
        startGame();
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

// Initialize basic game function
async function initialize() {
    const { scene, camera, renderer } = await initScene();
    return { scene, camera, renderer };
}

// Function to start the game
export async function startGame() {
    console.log("Starting game with enhanced visibility");
    
    // Show loading progress
    const loadingStatus = document.getElementById('loading-status');
    const loadingProgress = document.getElementById('loading-progress');
    
    try {
        // Initialize game state if needed
        if (!window.gameState) {
            console.log("Initializing game state");
            window.gameState = {
                characters: {},
                scene: new THREE.Scene(),
                input: {
                    forward: false,
                    backward: false,
                    left: false,
                    right: false,
                    run: false
                }
            };
        }
        
        // Update loading status
        loadingStatus.textContent = "Setting up camera...";
        loadingProgress.style.width = "20%";
        
        // Create camera if needed
        if (!window.gameState.camera) {
            console.log("Creating camera");
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 1.5, 0);
            camera.lookAt(0, 1.5, -10);
            window.gameState.camera = camera;
        }
        
        // Update loading status
        loadingStatus.textContent = "Creating environment...";
        loadingProgress.style.width = "40%";
        
        // Create basic environment
        createBasicEnvironment();
        
        // Update loading status
        loadingStatus.textContent = "Loading Tokyo map...";
        loadingProgress.style.width = "60%";
        
        // Try loading Tokyo map
        try {
            if (window.gameState.scene && window.gameState.camera && window.gameState.renderer) {
                await loadTokyoMap(
                    window.gameState.scene,
                    window.gameState.camera,
                    window.gameState.renderer
                );
            }
        } catch (error) {
            console.warn("Tokyo map loading failed, using fallback environment:", error);
            createFallbackEnvironment();
        }
        
        // Update loading status
        loadingStatus.textContent = "Setting up animation...";
        loadingProgress.style.width = "80%";
        
        // Setup animation loop
        if (!window.animationLoopSetup) {
            setupAnimationLoop();
            window.animationLoopSetup = true;
        }
        
        // Final loading status
        loadingStatus.textContent = "Ready!";
        loadingProgress.style.width = "100%";
        
        // Hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }, 1000);
        
        console.log("Game started successfully");
        
    } catch (error) {
        console.error("Error starting game:", error);
        loadingStatus.textContent = "Error starting game. Please try again.";
        loadingProgress.style.width = "100%";
        document.getElementById('force-start').style.display = 'block';
    }
}

/**
 * Create a basic environment with visual markers for movement
 */
function createBasicEnvironment() {
    if (!window.gameState || !window.gameState.scene) {
        console.log("No scene available for basic environment");
        return;
    }
    
    const scene = window.gameState.scene;
    
    // Add some lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Ensure animation is running
    if (typeof fallbackAnimate === 'function') {
        fallbackAnimate();
    } else if (typeof window.fallbackAnimate === 'function') {
        window.fallbackAnimate();
    } else {
        console.warn("No animation function available");
        // Try to set up animation loop as last resort
        setupAnimationLoop();
    }
}

// Create a fallback environment if Tokyo map fails to load
function createFallbackEnvironment() {
    console.log("Creating fallback environment");
    
    if (!window.gameState || !window.gameState.scene) {
        console.log("No scene available for fallback environment");
        return;
    }
    
    const scene = window.gameState.scene;
    
    // Set sky background
    scene.background = new THREE.Color(0x87CEEB);
    
    // Add boxes as landmarks
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Create some landmark cubes at different positions
    const landmarks = [
        { position: [5, 0.5, 5], color: 0xFF0000 },
        { position: [-5, 0.5, 5], color: 0x00FF00 },
        { position: [5, 0.5, -5], color: 0x0000FF },
        { position: [-5, 0.5, -5], color: 0xFFFF00 }
    ];
    
    landmarks.forEach(landmark => {
        const material = new THREE.MeshBasicMaterial({ color: landmark.color });
        const cube = new THREE.Mesh(boxGeometry, material);
        cube.position.set(...landmark.position);
        scene.add(cube);
    });
}

// Setup animation loop for continuous rendering
function setupAnimationLoop() {
    console.log("Setting up animation loop");
    
    // Only setup if we have the necessary components
    if (!window.gameState || !window.gameState.scene || !window.gameState.camera) {
        console.error("Cannot setup animation loop - missing required components");
        return;
    }
    
    // Create renderer if it doesn't exist
    if (!window.gameState.renderer) {
        console.log("Creating renderer");
        
        // Find container element
        let container = document.getElementById('container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'container';
            document.body.appendChild(container);
        }
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        window.gameState.renderer = renderer;
    }
    
    // Animation function
    function animationLoop() {
        requestAnimationFrame(animationLoop);
        
        // Update position display
        if (typeof window.updatePositionDisplay === 'function') {
            window.updatePositionDisplay();
        }
        
        // Render scene
        window.gameState.renderer.render(window.gameState.scene, window.gameState.camera);
    }
    
    // Start animation
    animationLoop();
}

/**
 * Basic animation function if the main one isn't working
 */
function fallbackAnimate() {
    // Check if we need to start our own animation loop
    const scene = window.gameState?.scene;
    const camera = window.gameState?.camera;
    const renderer = window.gameState?.renderer;
    
    if (scene && camera && renderer) {
        // Render scene
        renderer.render(scene, camera);
        
        // Request next frame unless already running
        if (!window.animationRunning) {
            window.animationRunning = true;
            
            function fallbackAnimationLoop() {
                // Render scene
                renderer.render(scene, camera);
                
                // Request next frame
                requestAnimationFrame(fallbackAnimationLoop);
            }
            
            // Start animation loop
            fallbackAnimationLoop();
            
            console.log("Started fallback animation loop");
        }
    } else {
        console.warn("Cannot start animation: missing scene, camera, or renderer");
    }
}

// Initialize vendor in the scene
function initializeVendor(scene) {
    const vendorGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const vendorMaterial = new THREE.MeshPhongMaterial({ color: 0x4CAF50 });
    const vendor = new THREE.Mesh(vendorGeometry, vendorMaterial);
    
    vendor.position.copy(vendorData.position);
    vendor.name = 'vendor';
    
    // Add a floating animation
    const animate = () => {
        vendor.position.y = vendorData.position.y + Math.sin(Date.now() * 0.002) * 0.1;
        requestAnimationFrame(animate);
    };
    animate();
    
    scene.add(vendor);
    
    // Add a point light above the vendor
    const vendorLight = new THREE.PointLight(0x4CAF50, 1, 3);
    vendorLight.position.set(
        vendorData.position.x,
        vendorData.position.y + 1,
        vendorData.position.z
    );
    scene.add(vendorLight);
    
    return vendor;
}

function startDialogueSequence(dialogueSteps) {
    if (!dialogueSteps || !dialogueSteps.length) return;
    
    console.log('Starting dialogue sequence with:', dialogueSteps);
    
    // Remove the menu first
    const choiceMenu = document.getElementById('dialogue-choice-menu');
    if (choiceMenu) {
        choiceMenu.remove();
    }
    
    // Get or create dialogue container
    let dialogueContainer = document.getElementById('dialogue-container');
    if (!dialogueContainer) {
        dialogueContainer = document.createElement('div');
        dialogueContainer.id = 'dialogue-container';
        dialogueContainer.className = 'dialogue-container';
        document.body.appendChild(dialogueContainer);
    }
    
    // Make sure container is visible
    dialogueContainer.style.display = 'block';
    
    // Update game state
    window.gameState.isDialogueActive = true;
    window.gameState.isChoosingDialogue = false;
    window.gameState.hasJustFinishedDialogue = true;
    window.gameState.currentDialogueSteps = dialogueSteps;
    window.gameState.currentDialogueStep = 0;
    
    // Initialize dialogue manager if not exists
    if (!window.gameState.dialogueManager) {
        window.gameState.dialogueManager = initializeDialogue(dialogueContainer, window.supabase);
    }
    
    // Clear any existing dialogue boxes
    dialogueContainer.innerHTML = '';
    
    // Start the dialogue
    console.log('Starting dialogue with number:', dialogueSteps[0].dialogue_number);
    window.gameState.dialogueManager.startDialogue(dialogueSteps[0].dialogue_number);
} 