// src/data/userSessions.js

const userSessions = new Map(); // Stores WhatsApp_ID -> { jwtToken, userEmail, userName }

module.exports = {
    /**
     * Stores a user's session information.
     * @param {string} whatsappId - The WhatsApp ID of the user (e.g., "1234567890@c.us").
     * @param {string} jwtToken - The JWT token received from the AdsNetwork API.
     * @param {string} userEmail - The user's email.
     * @param {string} userName - The user's username.
     */
    setSession: (whatsappId, jwtToken, userEmail, userName) => {
        userSessions.set(whatsappId, { jwtToken, userEmail, userName });
        console.log(`[SESSION] Session set for ${userEmail} (WhatsApp ID: ${whatsappId})`);
    },

    /**
     * Retrieves a user's session information.
     * @param {string} whatsappId - The WhatsApp ID of the user.
     * @returns {{jwtToken: string, userEmail: string, userName: string} | undefined} - The session object or undefined if not found.
     */
    getSession: (whatsappId) => {
        return userSessions.get(whatsappId);
    },

    /**
     * Checks if a user has an active session.
     * @param {string} whatsappId - The WhatsApp ID of the user.
     * @returns {boolean} - True if a session exists, false otherwise.
     */
    hasSession: (whatsappId) => {
        return userSessions.has(whatsappId);
    },

    /**
     * Deletes a user's session.
     * @param {string} whatsappId - The WhatsApp ID of the user.
     */
    deleteSession: (whatsappId) => {
        const session = userSessions.get(whatsappId);
        if (session) {
            console.log(`[SESSION] Session deleted for ${session.userEmail} (WhatsApp ID: ${whatsappId})`);
            userSessions.delete(whatsappId);
        }
    }
};
