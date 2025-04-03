/**
 * Text matching utilities for speech recognition
 */

/**
 * Calculate the Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Distance between strings
 */
export function levenshteinDistance(a, b) {
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
}

/**
 * Find best match for a phrase from a list of options
 * @param {string} phrase - Phrase to match
 * @param {string[]} options - Array of options to match against
 * @returns {object} - Best match with score and index
 */
export function findBestMatch(phrase, options) {
    const phraseWords = phrase.toLowerCase().split(/\s+/);
    let bestMatch = { score: 0, index: -1 };
    
    options.forEach((option, index) => {
        const optionWords = option.toLowerCase().split(/\s+/);
        
        // Count matching words
        let matchingWords = 0;
        let totalWords = optionWords.length;
        
        optionWords.forEach(optionWord => {
            // Check if option word appears in phrase
            const wordMatches = phraseWords.some(phraseWord => {
                const distance = levenshteinDistance(phraseWord, optionWord);
                // Allow some fuzziness based on word length
                const maxDistance = Math.floor(optionWord.length / 3);
                return distance <= maxDistance;
            });
            
            if (wordMatches) {
                matchingWords++;
            }
        });
        
        // Calculate match score (percentage of matching words)
        const score = totalWords > 0 ? matchingWords / totalWords : 0;
        
        // Update best match if better score found
        if (score > bestMatch.score) {
            bestMatch = { score, index };
        }
    });
    
    return bestMatch;
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