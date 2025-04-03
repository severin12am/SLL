/**
 * Setup mouse controls for camera rotation
 * @param {Object} inputState - The input state object to update
 * @param {Function} updateCameraFn - The function to call for camera updates
 */
export function setupMouseControls(inputState, updateCameraFn) {
    // Mouse movement handling for camera rotation
    document.addEventListener('mousemove', (event) => {
        if (document.pointerLockElement === document.body) {
            // Update mouse position for direct access
            inputState.mouse.x += event.movementX * 0.002;
            inputState.mouse.y += event.movementY * 0.002;
            
            // Also update yaw and pitch for camera rotation
            inputState.yaw -= event.movementX * 0.002;
            inputState.pitch -= event.movementY * 0.002;
            
            // Clamp vertical rotation to prevent flipping
            inputState.mouse.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, inputState.mouse.y));
            inputState.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, inputState.pitch));
            
            if (updateCameraFn) updateCameraFn();
        }
    });

    // Setup pointer lock on click
    document.addEventListener('click', () => {
        if (!document.pointerLockElement) {
            document.body.requestPointerLock();
        }
    });

    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
        inputState.isPointerLocked = document.pointerLockElement === document.body;
    });
    
    console.log('Mouse controls initialized');
} 