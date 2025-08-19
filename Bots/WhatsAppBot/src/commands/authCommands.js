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
        await replyCallback('🔐 *Login Format:*\n`!login <email> <password> <loc_name> <lat> <lng>`\n\n• Location name can include spaces naturally\n• Example: `!login user@example.com pass123 Colombo 6.9271 79.8612`');
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
        await replyCallback(`✅ *Login Successful*\n\nWelcome, ${response.user.username}! You are now logged in.\n\nYou can now use commands like:\n• View ads: \`!all\`\n• Search nearby: \`!nearby\`\n• Your profile: \`!profile\``);
    } catch (error) {
        await replyCallback(`❌ *Login Failed*\n\nUnable to log in. Error: ${error.message}\n\nPlease check your credentials and try again.`);
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
        const username = sessionManager.getSession(whatsappId)?.username || "User";
        sessionManager.deleteSession(whatsappId);
        await replyCallback(`👋 *Logout Successful*\n\nGoodbye, ${username}! You have been logged out.\n\nYou'll need to log in again to access personalized features.`);
    } else {
        await replyCallback('ℹ️ *Not Logged In*\n\nYou are not currently logged in. Use `!login` to sign in to your account.');
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
        await replyCallback(`👤 *Your Profile*\n\n*Username:* ${profile.username}\n*Email:* ${profile.email}\n*Phone:* ${profile.phone || 'Not provided'}\n*Location:* ${profile.location.name}\n*Coordinates:* ${profile.location.lat.toFixed(4)}, ${profile.location.lng.toFixed(4)}\n\nTo update your location, please log in again with new coordinates.`);
    } catch (error) {
        await replyCallback(`❌ *Profile Error*\n\nFailed to retrieve your profile information. Error: ${error.message}\n\nPlease try logging in again.`);
    }
};

module.exports = {
    handleLogin,
    handleLogout,
    handleProfile,
};