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
    const [email, password, loc_name_raw, latStr, lngStr] = args;
    const location = parseLocationArgs([loc_name_raw, latStr, lngStr], 0);

    if (!location) {
        await replyCallback('Invalid location details. Latitude and longitude must be numbers. Usage: `!login <email> <password> <loc_name> <lat> <lng>`.');
        return;
    }

    try {
        const response = await adsService.login(email, password, location);
        sessionManager.setSession(whatsappId, response.token, response.email, response.username);
        await replyCallback(`Logged in successfully as ${response.username}.`);
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