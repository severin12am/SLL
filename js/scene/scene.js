import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { setupLighting } from './lighting.js';
import { isMobile } from '../config.js';

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
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xbfe3dd);
        
        // Create camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1.6, 0);
        
        // Create renderer with options
        renderer = new THREE.WebGLRenderer({ 
            antialias: !isMobile, 
            powerPreference: 'high-performance' 
        });
        renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1) : window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Add renderer to DOM
        document.getElementById('container').appendChild(renderer.domElement);
        
        // Set up environment
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        
        // Set up lighting
        setupLighting(scene);
        
        // Set up window resize handler
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        resolve({ scene, camera, renderer });
    });
}

/**
 * Register an update function to be called in the animation loop
 * @param {Function} updateFunction - Function to call every frame
 */
export function registerUpdateFunction(updateFunction) {
    updateFunctions.push(updateFunction);
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
            console.error('Error in update function:', error);
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