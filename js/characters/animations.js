import * as THREE from 'three';
import { ANIMATIONS_CONFIG } from '../config.js';

/**
 * Setup animations for a character using GLTF/GLB animation clips
 * @param {Object} character - The character object
 * @param {string} characterType - The type of character (player, vendor, cat)
 * @returns {Promise} Promise that resolves when all animations are set up
 */
export function setupCharacterAnimations(character, characterType) {
    if (!character || !character.mixer) {
        return Promise.reject(new Error('Invalid character object'));
    }
    
    // Skip if no animation clips are available
    if (!character.animationClips || character.animationClips.length === 0) {
        console.warn(`No animation clips found for character: ${characterType}`);
        return Promise.resolve(character);
    }
    
    console.log(`Setting up animations for ${characterType} with ${character.animationClips.length} clips`);
    
    // Process all animation clips
    character.animationClips.forEach(clip => {
        const clipName = clip.name.toLowerCase();
        console.log(`Found animation clip: ${clipName}`);
        
        // Map standard names
        let animName = clipName;
        
        // Map common animation names to our standard names
        if (clipName.includes('idle') || clipName.includes('stand')) {
            animName = 'idle';
        } else if (clipName.includes('walk')) {
            animName = 'walking';
        } else if (clipName.includes('run')) {
            animName = 'running';
        } else if (clipName.includes('jump')) {
            animName = 'jump';
        } else if (clipName.includes('talk') || clipName.includes('speak')) {
            animName = 'talking';
        } else if (clipName.includes('magic') || clipName.includes('cast')) {
            animName = 'magic';
        }
        
        // Create action from the clip
        const action = character.mixer.clipAction(clip);
        
        // Store animation data
        character.animations[animName] = {
            clip: clip,
            action: action
        };
        
        // Set default properties
        action.clampWhenFinished = false;
        action.loop = THREE.LoopRepeat;
        
        // Handle special animations
        if (animName === 'jump' || animName === 'magic') {
            action.loop = THREE.LoopOnce;
            action.clampWhenFinished = true;
        }
        
        console.log(`Animation "${animName}" set up for ${character.id}`);
    });
    
    // Play idle animation by default
    if (character.animations.idle) {
        character.animations.idle.action.play();
        character.currentAnimation = 'idle';
        console.log(`Playing default idle animation for ${character.id}`);
    } else if (Object.keys(character.animations).length > 0) {
        // If no idle animation, play the first available animation
        const firstAnim = Object.keys(character.animations)[0];
        character.animations[firstAnim].action.play();
        character.currentAnimation = firstAnim;
        console.log(`No idle animation found for ${character.id}, playing ${firstAnim} instead`);
    }
    
    return Promise.resolve(character);
}

/**
 * Play a specific animation for a character
 * @param {Object} character - The character object
 * @param {string} animName - The animation name to play
 * @param {number} crossFadeDuration - Duration for cross-fading between animations
 * @param {Function} onFinish - Optional callback when animation completes
 */
export function playAnimation(character, animName, crossFadeDuration = 0.3, onFinish = null) {
    // Skip if character is invalid
    if (!character || !character.animations) {
        console.warn('Invalid character provided to playAnimation');
        return;
    }
    
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
    console.log(`Playing animation: ${animName} for ${character.id}`);
}

/**
 * Stop all animations for a character
 * @param {Object} character - The character object
 */
export function stopAllAnimations(character) {
    if (!character || !character.animations) return;
    
    Object.values(character.animations).forEach(anim => {
        if (anim.action) {
            anim.action.stop();
        }
    });
    
    character.currentAnimation = null;
} 