import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupCharacterAnimations } from './animations.js';
import { getScene } from '../scene/scene.js';
import { CHARACTER_CONFIG } from '../config.js';
import { registerCharacter } from '../game/game-manager.js';

// Character registry to keep track of all loaded characters
const characters = {};

/**
 * Load a character model
 * @param {string} modelPath - Path to the character GLTF/GLB model
 * @param {Object} position - Initial position as {x, y, z}
 * @param {number} scale - Scale factor for the model
 * @param {string} characterId - Identifier for the character
 * @returns {Promise<Object>} - Promise resolving to the loaded character object
 */
export function loadCharacter(modelPath, position, scale, characterId) {
    return new Promise((resolve, reject) => {
        const scene = getScene();
        if (!scene) {
            return reject(new Error('Scene not initialized'));
        }
        
        console.log(`Loading character: ${characterId} from ${modelPath}`);
        
        const loader = new GLTFLoader();
        
        loader.load(modelPath, (gltf) => {
            const model = gltf.scene;
            
            // Set up character model
            model.position.set(position.x, position.y, position.z);
            model.scale.set(scale, scale, scale);
            
            // Set up shadows
            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Create mixer for animations
            const mixer = new THREE.AnimationMixer(model);

            // Create character object with additional properties
            const character = {
                id: characterId,
                model: model,
                position: model.position,
                rotation: model.rotation,
                mixer: mixer,
                animations: {},
                animationClips: gltf.animations || [],
                isInteractive: characterId !== 'player',
                collisionDistance: CHARACTER_CONFIG[characterId]?.collisionDistance || 0.5,
                update: function(deltaTime) {
                    if (this.mixer) {
                        this.mixer.update(deltaTime);
                    }
                    // Update bounding box
                    if (!this.boundingBox) {
                        this.boundingBox = new THREE.Box3();
                    }
                    this.boundingBox.setFromObject(this.model);
                }
            };
            
            // Add character to scene
            scene.add(model);
            
            // Register character in the registry
            characters[characterId] = character;
            
            // Register with game manager
            registerCharacter(characterId, character);
            
            console.log(`Character loaded: ${characterId}`);
            
            // Setup animations with the loaded animation clips
            setupCharacterAnimations(character, characterId)
                .then(() => resolve(character))
                .catch(err => {
                    console.error(`Error setting up animations for ${characterId}:`, err);
                    resolve(character); // Resolve anyway to continue game flow
                });
            
        }, 
        // Progress callback
        (xhr) => {
            console.log(`${characterId} ${Math.round(xhr.loaded / xhr.total * 100)}% loaded`);
        },
        // Error callback
        (error) => {
            console.error(`Error loading character ${characterId}:`, error);
            reject(error);
        });
    });
}

/**
 * Create the player character
 * @returns {Promise<Object>} - Promise resolving to the player character
 */
export function loadPlayer() {
    const config = CHARACTER_CONFIG.player;
    return loadCharacter(
        'models/player.glb',
        config.initialPosition,
        config.scale,
        'player'
    );
}

/**
 * Load all NPC characters
 * @returns {Promise<Array>} - Promise resolving to an array of all NPCs
 */
export function loadCharacters() {
    console.log('Loading all characters...');
    const characterPromises = [];
    
    // Load player
    const playerPromise = loadPlayer();
    characterPromises.push(playerPromise);
    
    // Load vendor character
    const vendorConfig = CHARACTER_CONFIG.vendor;
    const vendorPromise = loadCharacter(
        'models/vendor.glb',
        vendorConfig.position,
        vendorConfig.scale,
        vendorConfig.id
    );
    characterPromises.push(vendorPromise);
    
    // Load cat character
    const catConfig = CHARACTER_CONFIG.cat;
    const catPromise = loadCharacter(
        'models/pop_cat.glb',
        catConfig.position,
        catConfig.scale,
        catConfig.id
    );
    characterPromises.push(catPromise);
    
    return Promise.all(characterPromises);
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
 * Get the nearest interactive character to the player
 * @param {THREE.Vector3} playerPosition - Player's position
 * @param {number} maxDistance - Maximum distance to consider
 * @returns {Object|null} The nearest character or null if none found
 */
export function getNearestInteractiveCharacter(playerPosition, maxDistance = 2.0) {
    if (!playerPosition) return null;
    
    let nearestCharacter = null;
    let shortestDistance = maxDistance;
    
    Object.values(characters).forEach(character => {
        if (character && character.id !== 'player' && character.isInteractive) {
            const distance = playerPosition.distanceTo(character.position);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestCharacter = character;
            }
        }
    });
    
    return nearestCharacter;
}

/**
 * Update all characters
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateCharacters(deltaTime) {
    Object.values(characters).forEach(character => {
        if (character && character.update) {
            character.update(deltaTime);
        }
    });
} 