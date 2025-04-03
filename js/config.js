/**
 * Game Configuration
 * Contains global constants and settings for the game
 */

// Configuration Constants

// Supabase configuration
export const SUPABASE_URL = 'https://fjvltffpcafcbbpwzyml.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdmx0ZmZwY2FmY2JicHd6eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MjUxNTQsImV4cCI6MjA1ODAwMTE1NH0.uuhJLxTJL26r2jfD9Cb5IMKYaScDNsJeHYJue4pfWRk';

// Map boundaries (invisible fence)
export const MAP_BOUNDARIES = {
    minX: -3,
    maxX: 3,
    minZ: -3,
    maxZ: 3
};

// Character interaction distances
export const DIALOGUE_DISTANCE = 2;
export const DIALOGUE_RESET_DISTANCE = 2;

// Movement settings
export const PLAYER_SPEED = 5.0;
export const MOUSE_SENSITIVITY = 0.002;
export const TOUCH_SENSITIVITY = 0.005;

// Speech recognition settings
export const MATCH_THRESHOLD = 60; // Percentage match needed to proceed
export const WORD_MATCH_THRESHOLD = 0.7; // Individual word match threshold

// Character positions and scales (for manual placement)
export const CHARACTER_SETTINGS = {
    popCat: {
        position: [2.1, -0.9, 1.9],
        scale: [0.013, 0.013, 0.013],
        rotation: Math.PI / 4,
        characterId: 5
    }
};

// Language settings
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' }
];

// Scene settings
export const SCENE_CONFIG = {
    backgroundColor: 0x87CEEB,  // Sky blue
    fogColor: 0xDFE9F3,
    fogNear: 10,
    fogFar: 30,
    ambientLightColor: 0xFFFFFF,
    ambientLightIntensity: 0.5,
    directionalLightColor: 0xFFFFFF,
    directionalLightIntensity: 1.0,
    directionalLightPosition: { x: 5, y: 10, z: 7.5 }
};

// Camera settings
export const CAMERA_CONFIG = {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 2, z: 5 },
    lookAt: { x: 0, y: 1, z: 0 }
};

// Character settings
export const CHARACTER_CONFIG = {
    player: {
        modelPath: 'models/player.glb',
        scale: 0.01,
        initialPosition: { x: 0, y: 0, z: 0 },
        walkSpeed: 2.5,
        runSpeed: 5.0,
        turnSpeed: 8.0,
        jumpHeight: 1.0,
        cameraHeight: 1.6,
        cameraDistance: 5
    },
    vendor: {
        id: 'vendor',
        name: 'Merchant',
        modelPath: 'models/vendor.glb',
        scale: 0.01,
        position: { x: 3, y: 0, z: -3 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        isInteractive: true,
        collisionDistance: 0.1
    },
    cat: {
        id: 'cat',
        name: 'Magic Cat',
        modelPath: 'models/pop_cat.glb',
        scale: 0.05,
        position: { x: -3, y: 0, z: -2 },
        rotation: { x: 0, y: -Math.PI / 4, z: 0 },
        isInteractive: true,
        collisionDistance: 0.5
    }
};

// Animation settings
export const ANIMATIONS_CONFIG = {
    crossFadeDuration: 0.3,
    player: {
        idle: 'animations/player/idle.fbx',
        walking: 'animations/player/walking.fbx',
        running: 'animations/player/running.fbx',
        jump: 'animations/player/jump.fbx'
    },
    vendor: {
        idle: 'animations/vendor/idle.fbx',
        talking: 'animations/vendor/talking.fbx'
    },
    cat: {
        idle: 'animations/cat/idle.fbx',
        talking: 'animations/cat/talking.fbx',
        magic: 'animations/cat/magic.fbx'
    }
};

// Physics settings
export const PHYSICS_CONFIG = {
    gravity: -9.8,
    collisionDistance: 0.5,
    groundLevel: 0
};

// Dialogue settings
export const DIALOGUE_CONFIG = {
    maxDistance: 2.0,
    cooldownTime: 2000,  // ms
    textSpeed: 50,  // ms per character
    optionDelay: 500  // ms before showing options
};

// Default language configuration
export const DEFAULT_LANGUAGE_CONFIG = {
    current: 'en',
    available: ['en', 'es', 'fr', 'de', 'ja'],
    recognitionLang: 'en-US',
    speechEnabled: true,
    voiceVolume: 1.0,
    voiceRate: 1.0,
    voicePitch: 1.0
};

// Input configuration
export const INPUT_CONFIG = {
    interactionKey: 'e',
    jumpKey: ' ',  // space
    movementKeys: {
        forward: ['w', 'ArrowUp'],
        backward: ['s', 'ArrowDown'],
        left: ['a', 'ArrowLeft'],
        right: ['d', 'ArrowRight']
    },
    touchControls: true,
    keyboardControls: true
};

// Debug settings
export const DEBUG_CONFIG = {
    showColliders: false,
    showStats: true,
    logLevel: 'info',  // debug, info, warn, error
    skipIntro: false,
    isDevelopment: true
};

// Mobile detection
export const isMobile = (typeof window !== 'undefined') && 
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia('(max-width: 767px)').matches)); 