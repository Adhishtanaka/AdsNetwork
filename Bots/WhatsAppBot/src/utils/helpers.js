// src/utils/helpers.js

const geohash = require('ngeohash');
const axios = require('axios');
// const MessageMedia = require('../structures/MessageMedia'); // Import MessageMedia
// const { MessageMedia } = require('whatsapp-web.js');

/**
 * Parses location arguments from a command string.
 * @param {string[]} args - Array of arguments from the command.
 * @param {number} startIndex - The index where location arguments start (e.g., 0 for !login <loc_name> <lat> <lng>).
 * @returns {{name: string, lat: number, lng: number, geohash: string} | null} - Parsed location object or null if invalid.
 */
const parseLocationArgs = (args, startIndex) => {
    if (args.length < startIndex + 3) { // Need loc_name, lat, lng
        return null;
    }
    const loc_name_raw = args[startIndex];
    const latStr = args[startIndex + 1];
    const lngStr = args[startIndex + 2];

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
        return null;
    }

    // Clean up location name: trim and replace underscores with spaces
    const name = loc_name_raw.trim().replace(/_/g, ' ');
    const geohashValue = geohash.encode(lat, lng);
    console.log(`[DEBUG] Parsed location: name=${name}, lat=${lat}, lng=${lng}, geohash=${geohashValue}`);

    return { name, lat, lng, geohash: geohashValue };
};

/**
 * Formats advertisement details into a readable string for display.
 * @param {object} ad - Advertisement object from the API.
 * @returns {string}
 */
const formatAdDetails = (ad) => {
    return `*Advertisement Details (ID: ${ad.id}):*
Title: ${ad.title}
Description: ${ad.description}
Price: ${ad.price}
Category: ${ad.category}
Location: ${ad.location.name} (Lat: ${ad.location.lat}, Lng: ${ad.location.lng})
Posted by: ${ad.userEmail}
Photos: ${ad.photoUrls && ad.photoUrls.length > 0 ? ad.photoUrls.join(', ') : 'N/A'}`;
};

/**
 * Formats comment details into a readable string for display.
 * @param {object} comment - Comment object from the API.
 * @returns {string}
 */
const formatCommentDetails = (comment) => {
    return `ID: ${comment.id}
Sentiment: ${comment.sentiment}
Description: ${comment.description}`;
};

/**
 * Checks if the user has an active session. If not, sends a message to the user.
 * @param {object | undefined} session - The user's session object.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 * @returns {Promise<boolean>} - True if authenticated, false otherwise.
 */
const ensureAuth = async (session, replyCallback) => {
    if (!session) {
        await replyCallback('You need to be logged in to use this command. Please use `!login <email> <password> <loc_name> <lat> <lng>` first.');
        return false;
    }
    return true;
};

/**
 * Calculate distance between two coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lng1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lng2 - Longitude of the second point.
 * @returns {number} - Distance in kilometers.
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
};

/**
 * Sorts advertisements by distance from a given location.
 * @param {Array} ads - Array of advertisement objects.
 * @param {number} userLat - User's latitude.
 * @param {number} userLng - User's longitude.
 * @param {number} maxDistance - Maximum distance in kilometers (optional).
 * @returns {Array} - Filtered and sorted array of advertisements.
 */
const sortAdsByDistance = (ads, userLat, userLng, maxDistance = null) => {
    // Add distance to each ad
    const adsWithDistance = ads.map(ad => {
        const adLat = ad.location?.lat;
        const adLng = ad.location?.lng;
        let distance = null;
        
        if (adLat && adLng) {
            distance = calculateDistance(userLat, userLng, adLat, adLng);
        }
        
        return { ...ad, distance };
    });

    // Filter by max distance if provided
    let result = adsWithDistance;
    if (maxDistance !== null) {
        result = result.filter(ad => ad.distance !== null && ad.distance <= maxDistance);
    }

    // Sort by distance (ascending)
    return result.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
    });
};

// short urls
const createShortUrl = async (fullUrl) => {
    try {
        // Use TinyURL API to create a real short URL
        const tinyUrlApiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`;
        const response = await axios.get(tinyUrlApiUrl);
        const shortUrl = response.data;
        
        // console.log(`Original URL: ${fullUrl}`);
        // console.log(`Short URL: ${shortUrl}`);
        console.log(`[DEBUG] Created short URL: ${shortUrl}`);
        
        return shortUrl;
    } catch (error) {
        console.error('Error creating URL:', error);
        return fullUrl; // Return original URL on error instead of throwing
    }
};


module.exports = {
    parseLocationArgs,
    formatAdDetails,
    formatCommentDetails,
    ensureAuth,
    calculateDistance,
    sortAdsByDistance,
    createShortUrl,
    // MessageMedia, // Export MessageMedia
};