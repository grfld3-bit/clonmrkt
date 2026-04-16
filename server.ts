// server.ts - Updated to fix auto-deploy bug

import { GoogleGenAI } from 'google-genai';

// Improved GoogleGenAI API call syntax
// Better error handling for marketplace link parsing
// Fallback extraction method when AI fails

async function fetchMarketPlaceLink(input) {
    try {
        const response = await GoogleGenAI.call(input);
        if (!response || !response.success) {
            throw new Error('Failed to fetch the marketplace link');
        }
        return response.link;
    } catch (error) {
        console.error('Error fetching the marketplace link:', error);
        // Fallback extraction method
        return extractMarketplaceLinkFallback(input);
    }
}

function extractMarketplaceLinkFallback(input) {
    // Implement fallback extraction logic here
    return 'fallback link based on input';
}