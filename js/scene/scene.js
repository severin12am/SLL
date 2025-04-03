import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { setupLighting } from './lighting.js';
import { createGround, createGridHelper } from './ground.js';
import { SCENE_CONFIG, DEBUG_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';

// Scene variables
let scene, camera, renderer;
let mixer;

// Game state for animation updates
let updateFunctions = [];

/**
 * Initialize the THREE.js scene
 * @returns {Promise<Object>} The scene, camera, and renderer
 */
export async function initScene() {
    return new Promise((resolve) => {
        logger.info('Initializing Three.js scene', 'SCENE');
        
        // Create scene with background color from config
        scene = new THREE.Scene();
        const backgroundColor = SCENE_CONFIG?.backgroundColor || 0x87CEEB; // Sky blue default
        scene.background = new THREE.Color(backgroundColor);
        
        // Add fog if configured
        if (SCENE_CONFIG?.fogColor) {
            scene.fog = new THREE.Fog(
                SCENE_CONFIG.fogColor,
                SCENE_CONFIG.fogNear || 10,
                SCENE_CONFIG.fogFar || 30
            );
            logger.debug('Scene fog enabled', 'SCENE');
        }
        
        // Create camera with config or defaults
        const cameraConfig = SCENE_CONFIG?.CAMERA_CONFIG || {
            fov: 75,
            near: 0.1,
            far: 1000,
            position: { x: 0, y: 1.6, z: 0 }
        };
        
        camera = new THREE.PerspectiveCamera(
            cameraConfig.fov,
            window.innerWidth / window.innerHeight,
            cameraConfig.near,
            cameraConfig.far
        );
        camera.position.set(
            cameraConfig.position.x,
            cameraConfig.position.y,
            cameraConfig.position.z
        );
        
        // Create renderer with options
        renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            powerPreference: 'high-performance' 
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add renderer to DOM
        document.getElementById('container').appendChild(renderer.domElement);
        
        // Set up environment
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        
        // Set up lighting
        setupLighting(scene);
        
        // Create ground and grid
        createGround(scene);
        
        // Add grid helper in debug mode
        if (DEBUG_CONFIG.showColliders) {
            createGridHelper(scene);
        }
        
        // Set up window resize handler
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        logger.info('Scene initialization complete', 'SCENE');
        resolve({ scene, camera, renderer });
    });
}

/**
 * Register an update function to be called in the animation loop
 * @param {Function} updateFunction - Function to call every frame
 */
export function registerUpdateFunction(updateFunction) {
    updateFunctions.push(updateFunction);
    logger.debug(`Update function registered (total: ${updateFunctions.length})`, 'SCENE');
}

/**
 * Animation loop
 */
export function animate() {
    requestAnimationFrame(animate);
    
    const delta = 0.016; // ~60fps
    
    // Update mixers
    if (mixer) mixer.update(delta);
    
    // Call all registered update functions
    updateFunctions.forEach(updateFunction => {
        try {
            updateFunction(delta);
        } catch (error) {
            logger.error(`Error in update function: ${error.message}`, 'SCENE');
            console.error(error); // Log full error for stack trace
        }
    });
    
    // Render scene
    renderer.render(scene, camera);
}

/**
 * Get the scene instance
 * @returns {THREE.Scene} The current scene
 */
export function getScene() {
    return scene;
}

/**
 * Get the camera instance
 * @returns {THREE.PerspectiveCamera} The current camera
 */
export function getCamera() {
    return camera;
}

/**
 * Get the renderer instance
 * @returns {THREE.WebGLRenderer} The current renderer
 */
export function getRenderer() {
    return renderer;
}

/**
 * Set the animation mixer for the scene
 * @param {THREE.AnimationMixer} newMixer - The animation mixer to use
 */
export function setMixer(newMixer) {
    mixer = newMixer;
} 