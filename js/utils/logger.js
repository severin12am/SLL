/**
 * Logger utility for better debugging and log management
 */

import { DEBUG_CONFIG } from '../config.js';

// Log levels
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

// Set current log level from config
let currentLogLevel = LOG_LEVELS.INFO;
if (DEBUG_CONFIG && DEBUG_CONFIG.logLevel) {
    const configLevel = DEBUG_CONFIG.logLevel.toUpperCase();
    if (LOG_LEVELS[configLevel] !== undefined) {
        currentLogLevel = LOG_LEVELS[configLevel];
    }
}

/**
 * Set the logger level
 * @param {string} level - Log level ('debug', 'info', 'warn', 'error', 'none')
 */
export function setLogLevel(level) {
    const upperLevel = level.toUpperCase();
    if (LOG_LEVELS[upperLevel] !== undefined) {
        currentLogLevel = LOG_LEVELS[upperLevel];
        logger.info(`Log level set to: ${level}`);
    } else {
        logger.error(`Invalid log level: ${level}. Using default.`);
    }
}

/**
 * Format a log message with timestamp and module name
 * @param {string} level - Log level
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @returns {string} Formatted message
 */
function formatMessage(level, module, message) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    return `[${timestamp}] [${level}] [${module}] ${message}`;
}

// Logger object with methods for each log level
export const logger = {
    /**
     * Log a debug message
     * @param {string} message - Log message
     * @param {string} module - Module name
     */
    debug: function(message, module = 'APP') {
        if (currentLogLevel <= LOG_LEVELS.DEBUG) {
            console.debug(formatMessage('DEBUG', module, message));
        }
    },
    
    /**
     * Log an info message
     * @param {string} message - Log message
     * @param {string} module - Module name
     */
    info: function(message, module = 'APP') {
        if (currentLogLevel <= LOG_LEVELS.INFO) {
            console.info(formatMessage('INFO', module, message));
        }
    },
    
    /**
     * Log a warning message
     * @param {string} message - Log message
     * @param {string} module - Module name
     */
    warn: function(message, module = 'APP') {
        if (currentLogLevel <= LOG_LEVELS.WARN) {
            console.warn(formatMessage('WARN', module, message));
        }
    },
    
    /**
     * Log an error message
     * @param {string} message - Log message
     * @param {string} module - Module name
     */
    error: function(message, module = 'APP') {
        if (currentLogLevel <= LOG_LEVELS.ERROR) {
            console.error(formatMessage('ERROR', module, message));
        }
    },
    
    /**
     * Group related log messages
     * @param {string} label - Group label
     * @param {string} module - Module name
     */
    group: function(label, module = 'APP') {
        if (currentLogLevel < LOG_LEVELS.NONE) {
            console.group(formatMessage('GROUP', module, label));
        }
    },
    
    /**
     * End a log group
     */
    groupEnd: function() {
        if (currentLogLevel < LOG_LEVELS.NONE) {
            console.groupEnd();
        }
    },
    
    /**
     * Log a message only in developer builds
     * @param {string} message - Log message
     * @param {string} module - Module name
     */
    dev: function(message, module = 'DEV') {
        if (DEBUG_CONFIG && DEBUG_CONFIG.isDevelopment) {
            console.log(`%c[DEV] [${module}] ${message}`, 'color: #9b59b6');
        }
    }
}; 