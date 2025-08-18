// src/commands/adBrowsingCommands.js

const { formatAdDetails, ensureAuth, sortAdsByDistance } = require('../utils/helpers');

/**
 * Handles the `!all_ads` command.
 * Retrieves and displays all available advertisements.
 * @param {object} adsService - The `AdsNetworkService` instance.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleAllAds = async (adsService, replyCallback) => {
    try {
        const response = await adsService.getAllAdvertisements();
        
        // Debug: Log the response structure
        // console.log('[DEBUG] API Response structure:', JSON.stringify(response, null, 2));
        
        // Handle different possible response formats
        let allAds;
        if (Array.isArray(response)) {
            // Direct array response
            allAds = response;
        } else if (response && Array.isArray(response.data)) {
            // Response wrapped in { data: [...] }
            allAds = response.data;
        } else if (response && Array.isArray(response.advertisements)) {
            // Response wrapped in { advertisements: [...] }
            allAds = response.advertisements;
        } else if (response && Array.isArray(response.ads)) {
            // Response wrapped in { ads: [...] }
            allAds = response.ads;
        } else {
            // Unexpected format
            console.error('[ERROR] Unexpected API response format:', response);
            await replyCallback(`Unexpected API response format. Expected array of ads but got: ${typeof response}`);
            return;
        }
        
        if (!allAds || allAds.length === 0) {
            await replyCallback('No advertisements available yet.');
        } else {
            let reply = '*All Advertisements:*\n\n';
            
            allAds.forEach((ad, index) => {
                // Handle cases where ad properties might be missing
                const adId = ad.id || ad._id || index + 1;
                const title = ad.title || 'No title';
                const price = ad.price || 'Price not specified';
                const category = ad.category || 'No category';
                const location = ad.location?.name || ad.location || 'Location not specified';
                const userEmail = ad.userEmail || ad.user?.email || ad.email || 'Unknown user';
                
                reply += `*ID:* ${adId}\n*Title:* ${title}\n*Price:* ${price}\n*Category:* ${category}\n*Location:* ${location}\n*Posted by:* ${userEmail}\n\n---\n\n`;
            });
            
            await replyCallback(reply);
        }
    } catch (error) {
        console.error('[ERROR] handleAllAds:', error);
        await replyCallback(`Failed to retrieve all ads: ${error.message}`);
    }
};

/**
 * Handles the `!view_ad` command.
 * Retrieves and displays detailed information for a specific advertisement.
 * @param {string[]} args - Command arguments: [adId].
 * @param {object} adsService - The `AdsNetworkService` instance.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleViewAd = async (args, adsService, replyCallback) => {
    if (args.length < 1) {
        await replyCallback('Usage: `!view_ad <adId>`');
        return;
    }
    
    const adId_view = args[0];
    
    try {
        const response = await adsService.getAdvertisementById(adId_view);
        
        // Debug: Log the response structure
        console.log('[DEBUG] View Ad API Response:', JSON.stringify(response, null, 2));
        
        // Handle different possible response formats
        let ad;
        if (response && (response.id || response._id || response.title)) {
            // Direct ad object
            ad = response;
        } else if (response && response.data) {
            // Response wrapped in { data: {...} }
            ad = response.data;
        } else if (response && response.advertisement) {
            // Response wrapped in { advertisement: {...} }
            ad = response.advertisement;
        } else if (response && response.ad) {
            // Response wrapped in { ad: {...} }
            ad = response.ad;
        } else {
            console.error('[ERROR] Unexpected view ad API response format:', response);
            await replyCallback(`Unexpected API response format for ad ID: ${adId_view}`);
            return;
        }
        
        await replyCallback(formatAdDetails(ad));
    } catch (error) {
        console.error('[ERROR] handleViewAd:', error);
        await replyCallback(`Failed to view ad: ${error.message}`);
    }
};

/**
 * Handles the `!nearby` command.
 * Retrieves advertisements and filters them by proximity to the user's location.
 * @param {string} whatsappId - The WhatsApp ID of the user.
 * @param {string[]} args - Command arguments: [maxDistance (optional)].
 * @param {object} sessionManager - The `userSessions` object.
 * @param {object} adsService - The `AdsNetworkService` instance.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleNearbyAds = async (whatsappId, args, sessionManager, adsService, replyCallback) => {
    const session = sessionManager.getSession(whatsappId);
    if (!(await ensureAuth(session, replyCallback))) return;
    
    // Get user's current location
    try {
        const profile = await adsService.getUserProfile(session.jwtToken);
        if (!profile.location || !profile.location.lat || !profile.location.lng) {
            await replyCallback('Your location information is missing or invalid. Please login again with valid location details.');
            return;
        }
        
        const userLat = profile.location.lat;
        const userLng = profile.location.lng;
        
        // Parse max distance parameter (in km), default to 10km if not provided
        let maxDistance = 10; // Default: 10km radius
        if (args.length > 0) {
            const parsedDistance = parseFloat(args[0]);
            if (!isNaN(parsedDistance) && parsedDistance > 0) {
                maxDistance = parsedDistance;
            }
        }
        
        // Get all ads
        const response = await adsService.getAllAdvertisements();
        
        // Handle different possible response formats (same as in handleAllAds)
        let allAds;
        if (Array.isArray(response)) {
            allAds = response;
        } else if (response && Array.isArray(response.data)) {
            allAds = response.data;
        } else if (response && Array.isArray(response.advertisements)) {
            allAds = response.advertisements;
        } else if (response && Array.isArray(response.ads)) {
            allAds = response.ads;
        } else {
            console.error('[ERROR] Unexpected API response format:', response);
            await replyCallback(`Unexpected API response format. Expected array of ads.`);
            return;
        }
        
        if (!allAds || allAds.length === 0) {
            await replyCallback('No advertisements available.');
            return;
        }
        
        // Sort and filter ads by distance
        const nearbyAds = sortAdsByDistance(allAds, userLat, userLng, maxDistance);
        
        if (nearbyAds.length === 0) {
            await replyCallback(`No advertisements found within ${maxDistance}km of your location.`);
            return;
        }
        
        // Format response
        let reply = `*Nearby Advertisements (Within ${maxDistance}km):*\n\n`;
        nearbyAds.forEach((ad) => {
            const adId = ad.id || ad._id;
            const title = ad.title || 'No title';
            const price = ad.price || 'Price not specified';
            const distance = ad.distance !== null ? 
                `${ad.distance.toFixed(2)}km away` : 
                'Distance unknown';
                
            reply += `*ID:* ${adId}\n*Title:* ${title}\n*Price:* ${price}\n*Distance:* ${distance}\n\n---\n\n`;
        });
        
        await replyCallback(reply);
    } catch (error) {
        console.error('[ERROR] handleNearbyAds:', error);
        await replyCallback(`Failed to retrieve nearby ads: ${error.message}`);
    }
};

module.exports = {
    handleAllAds,
    handleViewAd,
    handleNearbyAds,
};