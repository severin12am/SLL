/**
 * Setup keyboard controls
 * @param {Object} inputState - The input state object to update
 * @param {Object} config - Input configuration
 */
export function setupKeyboardControls(inputState, config) {
    // Default key mappings if not provided in config
    const keyMap = {
        forward: ['KeyW', 'ArrowUp'],
        backward: ['KeyS', 'ArrowDown'],
        left: ['KeyA', 'ArrowLeft'],
        right: ['KeyD', 'ArrowRight'],
        run: ['ShiftLeft', 'ShiftRight'],
        jump: ['Space'],
        interact: ['KeyE', 'Enter']
    };
    
    // Override with config if provided
    if (config && config.movementKeys) {
        Object.keys(config.movementKeys).forEach(action => {
            if (keyMap[action]) {
                keyMap[action] = config.movementKeys[action];
            }
        });
    }
    
    // Helper to check if a key matches an action
    function matchesAction(code, action) {
        return keyMap[action] && keyMap[action].includes(code);
    }
    
    // Handle key down events
    document.addEventListener('keydown', (event) => {
        // Skip if input is disabled
        if (!inputState.enabled) return;
        
        // Check all mapped actions
        if (matchesAction(event.code, 'forward')) {
            inputState.keys.forward = true;
        } else if (matchesAction(event.code, 'backward')) {
            inputState.keys.backward = true;
        } else if (matchesAction(event.code, 'left')) {
            inputState.keys.left = true;
        } else if (matchesAction(event.code, 'right')) {
            inputState.keys.right = true;
        } else if (matchesAction(event.code, 'run')) {
            inputState.keys.run = true;
        } else if (matchesAction(event.code, 'jump')) {
            inputState.keys.jump = true;
        } else if (matchesAction(event.code, 'interact')) {
            inputState.keys.interact = true;
        }
    });

    // Handle key up events
    document.addEventListener('keyup', (event) => {
        // Check all mapped actions
        if (matchesAction(event.code, 'forward')) {
            inputState.keys.forward = false;
        } else if (matchesAction(event.code, 'backward')) {
            inputState.keys.backward = false;
        } else if (matchesAction(event.code, 'left')) {
            inputState.keys.left = false;
        } else if (matchesAction(event.code, 'right')) {
            inputState.keys.right = false;
        } else if (matchesAction(event.code, 'run')) {
            inputState.keys.run = false;
        } else if (matchesAction(event.code, 'jump')) {
            inputState.keys.jump = false;
        } else if (matchesAction(event.code, 'interact')) {
            inputState.keys.interact = false;
        }
    });
    
    // Add focus/blur handlers to pause input when window loses focus
    window.addEventListener('blur', () => {
        // Reset all keys
        Object.keys(inputState.keys).forEach(key => {
            inputState.keys[key] = false;
        });
    });
    
    console.log('Keyboard controls initialized');
} 