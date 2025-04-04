import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SCENE_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Create a ground plane for the scene
 * @param {THREE.Scene} scene - The THREE.js scene to add the ground to
 * @returns {Promise<THREE.Group>} Promise resolving to the loaded 3D map
 */
export function createGround(scene) {
    if (!scene) {
        logger.error('Cannot create ground: scene is not defined', 'GROUND');
        return null;
    }
    
    return new Promise((resolve, reject) => {
        // First create a simple ground plane as fallback
        const size = 50;
        const color = 0x88bb44; // Grass green
        
        // Create ground geometry
        const groundGeometry = new THREE.PlaneGeometry(size, size);
        
        // Create ground material
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create ground mesh
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        
        // Rotate to be horizontal and position at y=0
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        
        // Set up shadows
        ground.receiveShadow = true;
        
        // Add to scene as fallback
        scene.add(ground);
        
        // Now load the Tokyo 3D model
        const loader = new GLTFLoader();
        
        loader.load('models/gltf/LittlestTokyo.glb', function(gltf) {
            // Remove the fallback ground
            scene.remove(ground);
            
            const model = gltf.scene;
            model.position.set(0, 0, 0);
            model.scale.set(0.01, 0.01, 0.01);
            
            // Set up shadows for all meshes in the model
            model.traverse(function(node) {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            
            // Add model to scene
            scene.add(model);
            
            logger.info('Tokyo 3D map loaded successfully', 'GROUND');
            
            // Create animation mixer if the model has animations
            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                mixer.clipAction(gltf.animations[0]).play();
                
                // Register animation update
                if (window.registerUpdateFunction) {
                    window.registerUpdateFunction((delta) => {
                        mixer.update(delta);
                    });
                }
            }
            
            resolve(model);
        }, 
        // Progress callback
        function(xhr) {
            logger.debug(`Tokyo map loading: ${Math.round(xhr.loaded / xhr.total * 100)}%`, 'GROUND');
        }, 
        // Error callback
        function(error) {
            logger.error('Error loading Tokyo map: ' + error.message, 'GROUND');
            logger.info('Using fallback ground plane', 'GROUND');
            resolve(ground); // Resolve with fallback ground
        });
    });
}

/**
 * Create a grid helper for the ground
 * @param {THREE.Scene} scene - The THREE.js scene to add the grid to
 * @param {number} size - Size of the grid
 * @param {number} divisions - Number of divisions in the grid
 * @returns {THREE.GridHelper} The created grid helper
 */
export function createGridHelper(scene, size = 50, divisions = 20) {
    if (!scene) {
        logger.error('Cannot create grid: scene is not defined', 'GROUND');
        return null;
    }
    
    // Create grid helper
    const gridHelper = new THREE.GridHelper(size, divisions, 0x555555, 0x333333);
    gridHelper.position.y = 0.01; // Slightly above ground to avoid z-fighting
    
    // Add to scene
    scene.add(gridHelper);
    
    logger.debug('Grid helper created', 'GROUND');
    
    return gridHelper;
} 