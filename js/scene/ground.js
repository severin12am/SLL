import * as THREE from 'three';
import { SCENE_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Create a ground plane for the scene
 * @param {THREE.Scene} scene - The THREE.js scene to add the ground to
 * @returns {THREE.Mesh} The created ground mesh
 */
export function createGround(scene) {
    if (!scene) {
        logger.error('Cannot create ground: scene is not defined', 'GROUND');
        return null;
    }
    
    // Create a simple ground plane
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
    
    // Add to scene
    scene.add(ground);
    
    logger.info('Ground plane created', 'GROUND');
    
    return ground;
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