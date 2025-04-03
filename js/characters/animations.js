import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Animation names to paths mapping
const ANIMATION_PATHS = {
    player: {
        idle: 'models/animations/player/idle.fbx',
        walking: 'models/animations/player/walking.fbx',
        talking: 'models/animations/player/talking.fbx'
    },
    vendor: {
        idle: 'models/animations/vendor/idle.fbx',
        talking: 'models/animations/vendor/talking.fbx'
    },
    cat: {
        idle: 'models/animations/cat/idle.fbx',
        meow: 'models/animations/cat/meow.fbx'
    }
};

/**
 * Load animation for a character
 * @param {Object} character - The character object with mixer
 * @param {string} animName - The animation name
 * @param {string} animPath - Path to the FBX animation file
 * @param {Object} loadingManager - THREE.LoadingManager instance
 * @returns {Promise<Object>} Promise resolving to animation data
 */
function loadAnimation(character, animName, animPath, loadingManager) {
    return new Promise((resolve, reject) => {
        const loader = new FBXLoader(loadingManager);
        
        loader.load(animPath, (animFbx) => {
            const animationClip = animFbx.animations[0];
            
            if (animationClip) {
                // Rename the animation to match our expected name
                animationClip.name = animName;
                
                // Create action from the clip using character's mixer
                const action = character.mixer.clipAction(animationClip);
                
                // Store animation data in character
                character.animations[animName] = {
                    clip: animationClip,
                    action: action
                };
                
                // Set default animation properties
                action.clampWhenFinished = false;
                action.loop = THREE.LoopRepeat;
                
                // Special handling for certain animations
                if (animName === 'meow') {
                    action.loop = THREE.LoopOnce;
                    action.clampWhenFinished = true;
                }
                
                console.log(`Loaded animation: ${animName} for ${character.id}`);
                resolve(character.animations[animName]);
            } else {
                console.warn(`No animation found in ${animPath}`);
                reject(new Error(`No animation found in ${animPath}`));
            }
        }, undefined, (error) => {
            console.error(`Error loading animation ${animName}:`, error);
            reject(error);
        });
    });
}

/**
 * Setup animations for a character based on its type
 * @param {Object} character - The character object
 * @param {Object} loadingManager - Optional loading manager
 * @returns {Promise} Promise that resolves when all animations are loaded
 */
export function setupCharacterAnimations(character, loadingManager) {
    const animationPromises = [];
    const characterAnims = ANIMATION_PATHS[character.id];
    
    if (!characterAnims) {
        console.warn(`No animations defined for character type: ${character.id}`);
        return Promise.resolve();
    }
    
    // Load each animation for this character
    for (const [animName, animPath] of Object.entries(characterAnims)) {
        const animPromise = loadAnimation(character, animName, animPath, loadingManager);
        animationPromises.push(animPromise);
    }
    
    return Promise.all(animationPromises)
        .then(() => {
            // Play idle animation by default
            if (character.animations.idle) {
                character.animations.idle.action.play();
                character.currentAnimation = 'idle';
            }
            return character;
        });
}

/**
 * Play a specific animation for a character
 * @param {Object} character - The character object
 * @param {string} animName - The animation name to play
 * @param {number} crossFadeDuration - Duration for cross-fading between animations
 * @param {Function} onFinish - Optional callback when animation completes
 */
export function playAnimation(character, animName, crossFadeDuration = 0.3, onFinish = null) {
    // Skip if animation doesn't exist or is already playing
    if (!character.animations[animName]) {
        console.warn(`Animation ${animName} not found for ${character.id}`);
        return;
    }
    
    if (character.currentAnimation === animName) {
        return;
    }
    
    const newAction = character.animations[animName].action;
    
    // If there's a current animation, cross fade to the new one
    if (character.currentAnimation && character.animations[character.currentAnimation]) {
        const currentAction = character.animations[character.currentAnimation].action;
        
        // Start the new action
        newAction.reset();
        newAction.play();
        
        // Cross fade from current to new
        newAction.crossFadeFrom(currentAction, crossFadeDuration, true);
        
        // Handle 'once' animations completion
        if (newAction.loop === THREE.LoopOnce) {
            newAction.reset();
            newAction.clampWhenFinished = true;
            
            // Add finish callback if provided
            if (onFinish) {
                const mixer = character.mixer;
                const onFinishEvent = (e) => {
                    if (e.action === newAction) {
                        onFinish();
                        mixer.removeEventListener('finished', onFinishEvent);
                        
                        // Reset to idle animation after finishing
                        if (character.animations.idle) {
                            playAnimation(character, 'idle', 0.3);
                        }
                    }
                };
                
                mixer.addEventListener('finished', onFinishEvent);
            }
        }
    } else {
        // Simply play the animation if no current one
        newAction.reset();
        newAction.play();
    }
    
    // Update current animation
    character.currentAnimation = animName;
}

/**
 * Stop all animations for a character
 * @param {Object} character - The character object
 */
export function stopAllAnimations(character) {
    if (!character.animations) return;
    
    Object.values(character.animations).forEach(anim => {
        if (anim.action) {
            anim.action.stop();
        }
    });
    
    character.currentAnimation = null;
} 