/**
 * Setup keyboard controls
 * @param {Object} inputState - The input state object to update
 */
export function setupKeyboardControls(inputState) {
    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                inputState.keys.forward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                inputState.keys.left = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                inputState.keys.backward = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                inputState.keys.right = true;
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                inputState.keys.forward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                inputState.keys.left = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                inputState.keys.backward = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                inputState.keys.right = false;
                break;
        }
    });
    
    console.log('Keyboard controls initialized');
} 