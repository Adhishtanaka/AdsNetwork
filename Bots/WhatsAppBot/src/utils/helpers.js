// src/utils/helpers.js

const geohash = require('geohash');

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

    const name = loc_name_raw.replace(/_/g, ' '); // Replace underscores with spaces for readability
    const geohashValue = geohash.encode(lat, lng);

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

module.exports = {
    parseLocationArgs,
    formatAdDetails,
    formatCommentDetails,
    ensureAuth,
};