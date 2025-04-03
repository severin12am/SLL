import * as THREE from 'three';

/**
 * Setup lighting for the scene
 * @param {THREE.Scene} scene - The THREE.js scene
 */
export function setupLighting(scene) {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Add hemisphere light for natural outdoor lighting
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8888ff, 0.5);
    scene.add(hemisphereLight);
} 