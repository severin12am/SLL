import * as THREE from 'three';
import { SCENE_CONFIG } from '../config.js';

/**
 * Setup lighting for the scene
 * @param {THREE.Scene} scene - The THREE.js scene
 */
export function setupLighting(scene) {
    if (!scene) {
        console.error('Cannot setup lighting: scene is not defined');
        return;
    }
    
    // Get lighting configuration or use defaults
    const config = SCENE_CONFIG || {
        ambientLightColor: 0xFFFFFF,
        ambientLightIntensity: 0.5,
        directionalLightColor: 0xFFFFFF,
        directionalLightIntensity: 1.0,
        directionalLightPosition: { x: 5, y: 10, z: 7.5 }
    };
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(
        config.ambientLightColor, 
        config.ambientLightIntensity
    );
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(
        config.directionalLightColor, 
        config.directionalLightIntensity
    );
    
    const dlPos = config.directionalLightPosition;
    directionalLight.position.set(dlPos.x, dlPos.y, dlPos.z);
    
    // Add shadow casting
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    
    scene.add(directionalLight);
    
    // Add hemisphere light for natural outdoor lighting
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8888ff, 0.5);
    scene.add(hemisphereLight);
    
    console.log('Scene lighting setup complete');
} 