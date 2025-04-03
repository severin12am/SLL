import * as THREE from 'three';
import { MAP_BOUNDARIES, CHARACTER_CONFIG } from '../config.js';
import { getCharacter, getAllCharacters } from './character-loader.js';
import { playAnimation } from './animations.js';
import { getCamera } from '../scene/scene.js';

// Default settings if config isn't available
const DEFAULT_SETTINGS = {
    moveSpeed: 2.5,
    runMultiplier: 2.0,
    turnSpeed: 0.1,
    jumpForce: 5.0,
    gravity: -9.8,
    cameraHeight: 1.6
};

/**
 * Get the effective settings for player movement
 * @returns {Object} Movement settings
 */
function getSettings() {
    if (CHARACTER_CONFIG && CHARACTER_CONFIG.player) {
        return {
            moveSpeed: CHARACTER_CONFIG.player.walkSpeed || DEFAULT_SETTINGS.moveSpeed,
            runMultiplier: CHARACTER_CONFIG.player.runSpeed / CHARACTER_CONFIG.player.walkSpeed || DEFAULT_SETTINGS.runMultiplier,
            turnSpeed: CHARACTER_CONFIG.player.turnSpeed || DEFAULT_SETTINGS.turnSpeed,
            jumpForce: CHARACTER_CONFIG.player.jumpHeight || DEFAULT_SETTINGS.jumpForce,
            gravity: DEFAULT_SETTINGS.gravity,
            cameraHeight: CHARACTER_CONFIG.player.cameraHeight || DEFAULT_SETTINGS.cameraHeight
        };
    }
    return DEFAULT_SETTINGS;
}

/**
 * Update player movement based on input state
 * @param {Object} player - The player character object
 * @param {Object} inputState - Current state of input controls
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updatePlayerMovement(player, inputState, deltaTime) {
    if (!player || !player.model) return;
    
    // Get settings
    const settings = getSettings();
    
    // Calculate movement direction from key inputs
    let moveX = 0;
    let moveZ = 0;
    
    if (inputState.forward) moveZ -= 1;
    if (inputState.backward) moveZ += 1;
    if (inputState.left) moveX -= 1;
    if (inputState.right) moveX += 1;
    
    // Check if moving
    const isMoving = moveX !== 0 || moveZ !== 0;
    
    // Play appropriate animation
    if (isMoving) {
        if (inputState.run && player.animations.running) {
            playAnimation(player, 'running');
        } else if (player.animations.walking) {
            playAnimation(player, 'walking');
        }
    } else if (!isMoving && player.currentAnimation !== 'idle' && 
               player.currentAnimation !== 'talking') {
        playAnimation(player, 'idle');
    }
    
    // Calculate movement vector based on camera direction
    if (isMoving) {
        // Get camera for direction
        const camera = getCamera();
        if (!camera) return;
        
        // Get camera direction (excluding Y rotation)
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(camera.quaternion);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        // Calculate right vector
        const rightVector = new THREE.Vector3(1, 0, 0);
        rightVector.applyQuaternion(camera.quaternion);
        rightVector.y = 0;
        rightVector.normalize();
        
        // Create movement vector
        const moveVector = new THREE.Vector3();
        moveVector.add(cameraDirection.multiplyScalar(moveZ));
        moveVector.add(rightVector.multiplyScalar(moveX));
        
        // Only normalize if there's movement
        if (moveVector.length() > 0) {
            moveVector.normalize();
            
            // Apply movement speed
            let speed = settings.moveSpeed * deltaTime;
            if (inputState.run) {
                speed *= settings.runMultiplier;
            }
            
            moveVector.multiplyScalar(speed);
            
            // Store current position before movement
            const oldPosition = player.model.position.clone();
            
            // Calculate new position
            const newPosition = oldPosition.clone().add(moveVector);
            
            // Check map boundaries
            const withinBounds = (
                newPosition.x >= MAP_BOUNDARIES.minX && 
                newPosition.x <= MAP_BOUNDARIES.maxX && 
                newPosition.z >= MAP_BOUNDARIES.minZ && 
                newPosition.z <= MAP_BOUNDARIES.maxZ
            );
            
            // Check collisions with characters
            let canMove = withinBounds;
            if (canMove) {
                canMove = !checkCollisions(player, newPosition);
            }
            
            // Move player if allowed
            if (canMove) {
                player.model.position.copy(newPosition);
                
                // Update player's position property to match model
                player.position.copy(newPosition);
                
                // Rotate player to face movement direction
                const targetRotation = Math.atan2(moveVector.x, moveVector.z);
                rotatePlayerTowards(player.model, targetRotation, settings.turnSpeed);
            }
        }
    }
    
    // Update camera position to follow player
    updateCameraPosition(player);
}

/**
 * Gradually rotate player to face a target direction
 * @param {THREE.Object3D} playerObj - The player's 3D object
 * @param {number} targetRotation - The target Y rotation in radians
 * @param {number} turnSpeed - Speed of rotation
 */
function rotatePlayerTowards(playerObj, targetRotation, turnSpeed) {
    // Calculate difference in rotation
    let rotDiff = targetRotation - playerObj.rotation.y;
    
    // Normalize to -PI to PI range
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    
    // Apply rotation with smooth turning
    if (Math.abs(rotDiff) > 0.01) {
        playerObj.rotation.y += rotDiff * turnSpeed;
    } else {
        playerObj.rotation.y = targetRotation;
    }
}

/**
 * Update camera position to follow player
 * @param {Object} player - The player character object
 */
function updateCameraPosition(player) {
    // Get camera
    const camera = getCamera();
    if (!camera || !player || !player.model) return;
    
    // Position camera at player's position
    const playerPos = player.model.position;
    const settings = getSettings();
    
    // Set camera position to match player
    // Note: We don't change the camera's rotation here, only position
    camera.position.set(playerPos.x, playerPos.y + settings.cameraHeight, playerPos.z);
}

/**
 * Check for collisions between player and other characters
 * @param {Object} player - The player character object
 * @param {THREE.Vector3} newPosition - The proposed new position
 * @returns {boolean} True if collision would occur
 */
function checkCollisions(player, newPosition) {
    // Get all characters
    const characters = getAllCharacters();
    const collisionDistance = 0.5; // General collision distance
    
    // Create a bounding sphere for collision check
    const playerSphere = new THREE.Sphere(newPosition, collisionDistance);
    
    // Check collision with each character
    for (const [id, character] of Object.entries(characters)) {
        if (id !== 'player' && character && character.model) {
            // Get character's collision distance (or use default)
            const charCollisionDistance = character.collisionDistance || collisionDistance;
            
            // Create a sphere for the character
            const charPos = character.model.position;
            const charSphere = new THREE.Sphere(charPos, charCollisionDistance);
            
            // Check if spheres intersect
            if (playerSphere.intersectsSphere(charSphere)) {
                console.log(`Collision detected with ${id}`);
                return true;
            }
        }
    }
    
    return false;
} 