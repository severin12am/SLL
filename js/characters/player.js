import * as THREE from 'three';
import { MAP_BOUNDARIES } from '../config.js';
import { getCharacter, getAllCharacters } from './character-loader.js';
import { playAnimation } from './animations.js';

// Player movement settings
const MOVE_SPEED = 0.1;
const RUN_MULTIPLIER = 1.5;
const TURN_SPEED = 0.03;
const COLLISION_DISTANCE = 1.0;

/**
 * Update player movement based on input state
 * @param {Object} player - The player character object
 * @param {Object} inputState - Current state of input controls
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updatePlayerMovement(player, inputState, deltaTime) {
    if (!player || !player.model) return;
    
    // Player model and camera references
    const playerObj = player.model;
    const camera = player.camera;
    
    // Calculate movement direction from key inputs
    let moveX = 0;
    let moveZ = 0;
    
    if (inputState.keys.forward) moveZ -= 1;
    if (inputState.keys.backward) moveZ += 1;
    if (inputState.keys.left) moveX -= 1;
    if (inputState.keys.right) moveX += 1;
    
    // Check if moving
    const isMoving = moveX !== 0 || moveZ !== 0;
    
    // Play appropriate animation
    if (isMoving && player.currentAnimation !== 'walking') {
        playAnimation(player, 'walking');
    } else if (!isMoving && player.currentAnimation !== 'idle' && 
               player.currentAnimation !== 'talking') {
        playAnimation(player, 'idle');
    }
    
    // Calculate movement vector based on camera direction
    if (isMoving) {
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
            let currentSpeed = MOVE_SPEED;
            if (inputState.keys.run) {
                currentSpeed *= RUN_MULTIPLIER;
            }
            
            moveVector.multiplyScalar(currentSpeed);
            
            // Store current position before movement
            const oldPosition = playerObj.position.clone();
            
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
                playerObj.position.copy(newPosition);
                
                // Rotate player to face movement direction
                const targetRotation = Math.atan2(moveVector.x, moveVector.z);
                rotatePlayerTowards(playerObj, targetRotation);
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
 */
function rotatePlayerTowards(playerObj, targetRotation) {
    // Calculate difference in rotation
    let rotDiff = targetRotation - playerObj.rotation.y;
    
    // Normalize to -PI to PI range
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    
    // Apply rotation with smooth turning
    if (Math.abs(rotDiff) > 0.01) {
        playerObj.rotation.y += rotDiff * TURN_SPEED;
    } else {
        playerObj.rotation.y = targetRotation;
    }
}

/**
 * Update camera position to follow player
 * @param {Object} player - The player character object
 */
function updateCameraPosition(player) {
    if (!player || !player.camera || !player.model) return;
    
    // Position camera slightly above player's head
    const playerPos = player.model.position;
    const offsetY = 1.6; // Camera height above player
    
    // Update camera position
    player.camera.position.set(playerPos.x, playerPos.y + offsetY, playerPos.z);
}

/**
 * Check for collisions between player and other characters
 * @param {Object} player - The player character object
 * @param {THREE.Vector3} newPosition - The proposed new position
 * @returns {boolean} True if collision would occur
 */
function checkCollisions(player, newPosition) {
    const characters = getAllCharacters();
    
    // Create a bounding sphere around the proposed player position
    const playerSphere = new THREE.Sphere(
        newPosition,
        COLLISION_DISTANCE / 2
    );
    
    // Check collision with each character except player
    for (const [id, character] of Object.entries(characters)) {
        if (id !== 'player' && character && character.model) {
            // Skip if character doesn't have a valid bounding box
            if (!character.boundingBox) continue;
            
            // Create copy of the bounding box to avoid modifying original
            const charBox = character.boundingBox.clone();
            
            // If bounds intersect, return collision
            if (charBox.intersectsSphere(playerSphere)) {
                return true;
            }
        }
    }
    
    return false;
} 