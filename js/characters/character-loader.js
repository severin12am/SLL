import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { setupCharacterAnimations } from './animations.js';
import { calculateDistance } from '../utils/distance.js';

// Character registry to keep track of all loaded characters
const characters = {
    player: null,
    vendor: null,
    cat: null
};

/**
 * Load a character model
 * @param {Object} scene - The THREE.js scene to add the character to
 * @param {string} modelPath - Path to the character FBX model
 * @param {Object} position - Initial position as {x, y, z}
 * @param {number} scale - Scale factor for the model
 * @param {string} characterId - Identifier for the character (player, vendor, cat)
 * @param {Object} loadingManager - THREE.LoadingManager instance
 * @returns {Promise<Object>} - Promise resolving to the loaded character object
 */
export function loadCharacter(scene, modelPath, position, scale, characterId, loadingManager) {
    return new Promise((resolve, reject) => {
        const loader = new FBXLoader(loadingManager);
        
        loader.load(modelPath, (fbx) => {
            console.log(`Loading character: ${characterId}`);
            
            // Set up character model
            fbx.position.set(position.x, position.y, position.z);
            fbx.scale.set(scale, scale, scale);
            fbx.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Create character object with additional properties
            const character = {
                model: fbx,
                id: characterId,
                position: fbx.position,
                rotation: fbx.rotation,
                mixer: new THREE.AnimationMixer(fbx),
                animations: {},
                isInteractive: characterId !== 'player',
                dialogueId: characterId,
                boundingBox: new THREE.Box3().setFromObject(fbx)
            };
            
            // Add character to scene
            scene.add(fbx);
            
            // Register character in the global registry
            characters[characterId] = character;
            console.log(`Character loaded: ${characterId}`);
            
            // Setup animations and resolve the promise
            setupCharacterAnimations(character)
                .then(() => resolve(character))
                .catch(err => reject(err));
            
        }, undefined, (error) => {
            console.error(`Error loading character ${characterId}:`, error);
            reject(error);
        });
    });
}

/**
 * Create the player character
 * @param {Object} scene - The THREE.js scene
 * @param {THREE.Camera} camera - The player camera
 * @param {Object} loadingManager - THREE.LoadingManager instance
 * @returns {Promise<Object>} - Promise resolving to the player character
 */
export function createPlayer(scene, camera, loadingManager) {
    const playerPosition = { x: 0, y: 0, z: 0 };
    const playerScale = 0.01;
    
    return loadCharacter(scene, 'models/characters/player.fbx', playerPosition, playerScale, 'player', loadingManager)
        .then(player => {
            // Add camera to player
            player.camera = camera;
            
            // Add player-specific methods
            player.update = (deltaTime) => {
                // Update player animations if available
                if (player.mixer) {
                    player.mixer.update(deltaTime);
                }
            };
            
            console.log('Player character created');
            return player;
        });
}

/**
 * Load all NPC characters
 * @param {Object} scene - The THREE.js scene
 * @param {Object} loadingManager - THREE.LoadingManager instance 
 * @returns {Promise<Array>} - Promise resolving to an array of all NPCs
 */
export function loadNPCs(scene, loadingManager) {
    const npcs = [];
    
    // Vendor character
    const vendorPosition = { x: 3, y: 0, z: -3 };
    const vendorPromise = loadCharacter(scene, 'models/characters/vendor.fbx', vendorPosition, 0.01, 'vendor', loadingManager);
    npcs.push(vendorPromise);
    
    // Cat character
    const catPosition = { x: -3, y: 0, z: -2 };
    const catPromise = loadCharacter(scene, 'models/characters/cat.fbx', catPosition, 0.01, 'cat', loadingManager);
    npcs.push(catPromise);
    
    return Promise.all(npcs);
}

/**
 * Get a character by ID
 * @param {string} characterId - ID of the character to retrieve
 * @returns {Object|null} - The character object or null if not found
 */
export function getCharacter(characterId) {
    return characters[characterId] || null;
}

/**
 * Get all registered characters
 * @returns {Object} - Object containing all character objects
 */
export function getAllCharacters() {
    return characters;
}

/**
 * Check if the player is close to any interactive character
 * @param {Object} player - The player character
 * @returns {Object|null} - The closest interactive character within range, or null
 */
export function getNearestInteractiveCharacter(player) {
    const MAX_INTERACTION_DISTANCE = 2.0;
    let closestCharacter = null;
    let closestDistance = Infinity;
    
    Object.values(characters).forEach(character => {
        if (character && character.isInteractive) {
            const distance = calculateDistance(player.position, character.position);
            
            if (distance < MAX_INTERACTION_DISTANCE && distance < closestDistance) {
                closestDistance = distance;
                closestCharacter = character;
            }
        }
    });
    
    return closestCharacter;
}

/**
 * Update all characters
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateCharacters(deltaTime) {
    Object.values(characters).forEach(character => {
        if (character && character.mixer) {
            character.mixer.update(deltaTime);
        }
        
        // Update character bounding box
        if (character && character.model) {
            character.boundingBox.setFromObject(character.model);
        }
    });
} 