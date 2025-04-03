/**
 * Text Matching Utility
 * Handles finding the best match between user input and available options
 */

import { logger } from './logger.js';

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} The edit distance between the strings
 */
function levenshteinDistance(a, b) {
    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 * Higher is more similar
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
    // Normalize strings: lowercase and remove punctuation
    const normalize = (s) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    const a = normalize(str1);
    const b = normalize(str2);
    
    // If both strings are empty, they're identical
    if (a.length === 0 && b.length === 0) return 1;
    
    // If either string is empty, similarity depends on the other's length
    if (a.length === 0 || b.length === 0) return 0;
    
    // Calculate Levenshtein distance
    const distance = levenshteinDistance(a, b);
    
    // Convert to similarity score (1 - normalized distance)
    const maxLength = Math.max(a.length, b.length);
    return 1 - (distance / maxLength);
}

/**
 * Find words from a string that match any part of candidate strings
 * @param {string} input - Input string to search within
 * @param {string[]} candidates - Array of candidate strings to match against
 * @returns {Object} Object containing matched words and their positions
 */
function findMatchingWords(input, candidates) {
    const matches = {};
    const words = input.toLowerCase().split(/\s+/);
    
    candidates.forEach((candidate, index) => {
        const candidateWords = candidate.toLowerCase().split(/\s+/);
        
        words.forEach((word, wordIndex) => {
            if (word.length < 3) return; // Skip very short words
            
            candidateWords.forEach(candidateWord => {
                if (candidateWord.includes(word) || word.includes(candidateWord)) {
                    if (!matches[index]) {
                        matches[index] = {
                            count: 0,
                            words: [],
                            positions: []
                        };
                    }
                    matches[index].count++;
                    matches[index].words.push(word);
                    matches[index].positions.push(wordIndex);
                }
            });
        });
    });
    
    return matches;
}

/**
 * Find the best match for an input string from an array of options
 * @param {string} input - The input string to match
 * @param {string[]} options - Array of option strings to match against
 * @returns {Object} Best match information: {text, index, score}
 */
export function findBestMatch(input, options) {
    if (!input || !options || options.length === 0) {
        return { text: '', index: -1, score: 0 };
    }
    
    logger.debug(`Finding best match for: "${input}"`, 'TEXT_MATCHING');
    
    // Calculate similarity scores for each option
    const scores = options.map(option => calculateSimilarity(input, option));
    
    // Also check for matching words
    const wordMatches = findMatchingWords(input, options);
    
    // Combine word matching with similarity scores
    const combinedScores = scores.map((score, i) => {
        let finalScore = score;
        if (wordMatches[i]) {
            // Boost score based on number of matching words
            const matchBoost = wordMatches[i].count * 0.1;
            finalScore = Math.min(finalScore + matchBoost, 1.0);
        }
        return finalScore;
    });
    
    // Find the best match
    let bestScore = -1;
    let bestIndex = -1;
    
    for (let i = 0; i < combinedScores.length; i++) {
        if (combinedScores[i] > bestScore) {
            bestScore = combinedScores[i];
            bestIndex = i;
        }
    }
    
    const result = {
        text: bestIndex >= 0 ? options[bestIndex] : '',
        index: bestIndex,
        score: bestScore
    };
    
    logger.debug(`Best match: "${result.text}" with score ${result.score.toFixed(2)}`, 'TEXT_MATCHING');
    return result;
}

/**
 * Check if a string contains a keyword from a list
 * @param {string} input - The input string to check
 * @param {string[]} keywords - Array of keywords to look for
 * @returns {boolean} True if input contains any of the keywords
 */
export function containsKeyword(input, keywords) {
    if (!input || !keywords || keywords.length === 0) return false;
    
    const normalizedInput = input.toLowerCase();
    
    for (const keyword of keywords) {
        if (normalizedInput.includes(keyword.toLowerCase())) {
            return true;
        }
    }
    
    return false;
}

/**
 * Highlight words in a string that match any words in the options
 * @param {string} text - The text to highlight
 * @param {string[]} options - Array of options containing target words
 * @returns {string} - HTML string with matched words highlighted
 */
export function highlightMatchedWords(text, options) {
    if (!text || !options || options.length === 0) {
        return text;
    }
    
    // Create array of all words from options
    const targetWords = options
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2) // Only consider words with 3+ characters
        .reduce((unique, word) => {
            if (!unique.includes(word)) {
                unique.push(word);
            }
            return unique;
        }, []);
    
    // Split text into words
    const words = text.split(/(\s+)/);
    
    // Highlight matching words
    const highlightedWords = words.map(word => {
        const wordLower = word.toLowerCase().replace(/[.,?!;:]/g, '');
        
        // Check if word matches any target word (with some fuzziness)
        const isMatch = targetWords.some(targetWord => {
            const distance = levenshteinDistance(wordLower, targetWord);
            // Allow more fuzziness for longer words
            const maxDistance = Math.max(1, Math.floor(targetWord.length / 4));
            return distance <= maxDistance;
        });
        
        // Return highlighted word or original word
        return isMatch 
            ? `<span style="color: #ffcc00; font-weight: bold;">${word}</span>` 
            : word;
    });
    
    return highlightedWords.join('');
} 