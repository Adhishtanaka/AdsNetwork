// src/commands/authCommands.js

const { parseLocationArgs, ensureAuth } = require('../utils/helpers');

/**
 * Handles the `!login` command.
 * Attempts to log in a user to the AdsNetwork API and stores their session.
 * @param {string} whatsappId - The WhatsApp ID of the user.
 * @param {string[]} args - Command arguments: [email, password, loc_name, lat, lng].
 * @param {object} sessionManager - The `userSessions` object.
 * @param {object} adsService - The `AdsNetworkService` instance.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleLogin = async (whatsappId, args, sessionManager, adsService, replyCallback) => {
    if (args.length < 5) {
        await replyCallback('Usage: `!login <email> <password> <loc_name> <lat> <lng>`\n_Location name should replace spaces with underscores (e.g., `Colombo_City`)._');
        return;
    }
    
    // Fix for argument parsing - extract all required parts correctly
    const email = args[0];
    const password = args[1];
    
    // Handle case where location name might contain spaces
    let locationIndex = 2;
    let locNameParts = [];
    let latIndex, lngIndex;
    
    // Find the first argument that could be a latitude (numeric)
    for (let i = 2; i < args.length - 1; i++) {
        if (!isNaN(parseFloat(args[i])) && isFinite(args[i])) {
            latIndex = i;
            lngIndex = i + 1;
            break;
        }
        locNameParts.push(args[i]);
    }
    
    // If we couldn't find latitude/longitude
    if (latIndex === undefined || lngIndex >= args.length) {
        await replyCallback('Invalid command format. Usage: `!login <email> <password> <loc_name> <lat> <lng>`\nMake sure latitude and longitude are valid numbers.');
        return;
    }
    
    const loc_name_raw = locNameParts.join('_');
    const latStr = args[latIndex];
    const lngStr = args[lngIndex];
    
    console.log(`[DEBUG] Parsed location: name=${loc_name_raw}, lat=${latStr}, lng=${lngStr}`);
    
    const location = parseLocationArgs([loc_name_raw, latStr, lngStr], 0);

    if (!location) {
        await replyCallback('Invalid location details. Latitude and longitude must be valid decimal numbers (e.g., 6.9271, 79.8612). Usage: `!login <email> <password> <loc_name> <lat> <lng>`.');
        return;
    }

    try {
        const response = await adsService.login(email, password, location);
        console.log(`[DEBUG] Login response: ${JSON.stringify(response)}`);
        sessionManager.setSession(whatsappId, response.token, response.email, response.username);
        await replyCallback(`Logged in successfully as ${response.user.username}.`);
    } catch (error) {
        await replyCallback(`Login failed: ${error.message}`);
    }
};

/**
 * Handles the `!logout` command.
 * Deletes the user's session from memory.
 * @param {string} whatsappId - The WhatsApp ID of the user.
 * @param {object} sessionManager - The `userSessions` object.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleLogout = async (whatsappId, sessionManager, replyCallback) => {
    if (sessionManager.hasSession(whatsappId)) {
        sessionManager.deleteSession(whatsappId);
        await replyCallback('You have been logged out.');
    } else {
        await replyCallback('You are not logged in.');
    }
};

/**
 * Handles the `!profile` command.
 * Retrieves and displays the user's profile from the AdsNetwork API.
 * @param {string} whatsappId - The WhatsApp ID of the user.
 * @param {object} sessionManager - The `userSessions` object.
 * @param {object} adsService - The `AdsNetworkService` instance.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleProfile = async (whatsappId, sessionManager, adsService, replyCallback) => {
    const session = sessionManager.getSession(whatsappId);
    if (!(await ensureAuth(session, replyCallback))) return;

    try {
        const profile = await adsService.getUserProfile(session.jwtToken);
        await replyCallback(`*Your Profile:*\nUsername: ${profile.username}\nEmail: ${profile.email}\nPhone: ${profile.phone}\nLocation: ${profile.location.name} (Lat: ${profile.location.lat}, Lng: ${profile.location.lng})`);
    } catch (error) {
        await replyCallback(`Failed to get profile: ${error.message}`);
    }
};

module.exports = {
    handleLogin,
    handleLogout,
    handleProfile,
};