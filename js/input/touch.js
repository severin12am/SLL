/**
 * Creates and appends a virtual joystick to the DOM
 * @returns {Object} The joystick element with inner and outer parts
 */
function createVirtualJoystick() {
    // Create outer joystick container
    const joystickOuter = document.createElement('div');
    joystickOuter.className = 'joystick-outer';
    joystickOuter.style.cssText = `
        position: fixed;
        bottom: 50px;
        left: 50px;
        width: 100px;
        height: 100px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        touch-action: none;
    `;

    // Create inner joystick knob
    const joystickInner = document.createElement('div');
    joystickInner.className = 'joystick-inner';
    joystickInner.style.cssText = `
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        touch-action: none;
    `;

    joystickOuter.appendChild(joystickInner);
    document.body.appendChild(joystickOuter);

    return {
        outer: joystickOuter,
        inner: joystickInner
    };
}

/**
 * Creates and appends mobile camera controls to the DOM
 * @returns {Object} The camera control area element
 */
function createCameraControls() {
    const cameraControl = document.createElement('div');
    cameraControl.className = 'camera-control';
    cameraControl.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 50%;
        height: 100%;
        z-index: 999;
        touch-action: none;
    `;
    document.body.appendChild(cameraControl);

    return cameraControl;
}

/**
 * Setup touch controls for mobile devices
 * @param {Object} inputState - The input state object to update
 * @param {Function} updateCameraFn - The function to call for camera updates
 */
export function setupTouchControls(inputState, updateCameraFn) {
    // Only setup for mobile devices
    if (!inputState.isMobile) {
        console.log('Touch controls skipped (not a mobile device)');
        return;
    }

    // Create UI elements
    const joystick = createVirtualJoystick();
    const cameraControl = createCameraControls();
    
    // Constants
    const joystickRadius = 50; // Half of joystick outer width
    const innerRadius = 20;   // Half of joystick inner width
    
    // Variables to track joystick state
    let joystickActive = false;
    let joystickStartX = 0;
    let joystickStartY = 0;

    // Handle joystick touch start
    joystick.outer.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joystick.outer.getBoundingClientRect();
        joystickStartX = rect.left + joystickRadius;
        joystickStartY = rect.top + joystickRadius;
        joystickActive = true;
        
        // Center the inner joystick on touch
        updateJoystickPosition(touch.clientX, touch.clientY);
    });

    // Handle joystick movement
    document.addEventListener('touchmove', (e) => {
        // Only process if joystick is active
        if (joystickActive) {
            e.preventDefault();
            const touch = e.touches[0];
            updateJoystickPosition(touch.clientX, touch.clientY);
        }
    }, { passive: false });

    // Handle touch end for joystick
    document.addEventListener('touchend', (e) => {
        // Reset joystick if it was active
        if (joystickActive) {
            joystickActive = false;
            resetJoystick();
            
            // Reset input keys
            inputState.keys.forward = false;
            inputState.keys.backward = false;
            inputState.keys.left = false;
            inputState.keys.right = false;
        }
    });

    // Handle camera control touch movement
    let lastTouchX = 0;
    let lastTouchY = 0;
    
    cameraControl.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    });
    
    cameraControl.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        
        // Calculate movement delta
        const deltaX = touch.clientX - lastTouchX;
        const deltaY = touch.clientY - lastTouchY;
        
        // Update camera rotation
        inputState.mouse.x += deltaX * 0.01;
        inputState.mouse.y += deltaY * 0.01;
        
        // Clamp vertical rotation
        inputState.mouse.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, inputState.mouse.y));
        
        // Update last position
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        
        // Call camera update function
        if (updateCameraFn) updateCameraFn();
    }, { passive: false });

    /**
     * Updates joystick position based on touch coordinates
     */
    function updateJoystickPosition(touchX, touchY) {
        // Calculate the vector from joystick center to touch point
        const deltaX = touchX - joystickStartX;
        const deltaY = touchY - joystickStartY;
        
        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Normalize distance to the joystick radius
        const clampedDistance = Math.min(distance, joystickRadius - innerRadius);
        
        let x, y;
        if (distance > 0) {
            // Calculate normalized position
            const normalizedX = deltaX / distance;
            const normalizedY = deltaY / distance;
            
            // Apply clamped distance
            x = normalizedX * clampedDistance;
            y = normalizedY * clampedDistance;
        } else {
            x = 0;
            y = 0;
        }
        
        // Update joystick visual position
        joystick.inner.style.transform = `translate(${x}px, ${y}px)`;
        
        // Determine input based on joystick position
        // Calculate normalized values between -1 and 1
        const inputX = x / (joystickRadius - innerRadius);
        const inputY = y / (joystickRadius - innerRadius);
        
        // Update input state based on joystick position
        inputState.keys.forward = inputY < -0.3;
        inputState.keys.backward = inputY > 0.3;
        inputState.keys.left = inputX < -0.3;
        inputState.keys.right = inputX > 0.3;
    }

    /**
     * Resets joystick position to center
     */
    function resetJoystick() {
        joystick.inner.style.transform = 'translate(0px, 0px)';
    }
    
    console.log('Touch controls initialized');
} 