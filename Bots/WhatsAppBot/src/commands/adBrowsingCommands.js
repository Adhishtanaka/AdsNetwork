// src/commands/adBrowsingCommands.js

const { formatAdDetails, ensureAuth, sortAdsByDistance, createShortUrl } = require('../utils/helpers');
const { MessageMedia } = require('whatsapp-web.js');

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
            
            for (const [index, ad] of allAds.entries()) {
                // Handle cases where ad properties might be missing
                const adId = ad.id || ad._id || index + 1;
                const adLink = `http://localhost:5173/browse-ads/${adId}`;
                const title = ad.title || 'No title';
                const price = ad.price || 'Price not specified';
                const category = ad.category || 'No category';
                const mapLink = await createShortUrl(`https://www.google.com/maps/place/${ad.location?.lat},${ad.location?.lng}`);
                const userEmail = ad.userEmail || ad.user?.email || ad.email || 'Unknown user';

                reply += `*Title:* ${title}\n*Price:* ${price}\n*Category:* ${category}\n*Location:* ${mapLink}\n*Posted by:* ${userEmail}\n*Page Link:* ${adLink}\n---\n\n`;
            }
            
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
 * @param {function(string, object=): Promise<void>} replyCallback - Function to send a reply message.
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
        
        let media = null;
        if (ad.photoUrls && ad.photoUrls.length > 0) {
            try {
                // Create a MessageMedia object from the first photo URL
                media = await MessageMedia.fromUrl(ad.photoUrls[0], { unsafeMime: true });
                console.log(`[INFO] Loaded photo for ad ${adId_view} from ${ad.photoUrls[0]}`);
            } catch (mediaError) {
                console.error(`[ERROR] Failed to load media for ad ${adId_view}:`, mediaError);
                // Continue without media if there's an error loading it
            }
        }
        
        // Send the formatted ad details with the photo if available
        await replyCallback(formatAdDetails(ad), media);
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
        console.log('[DEBUG] User profile:', JSON.stringify(profile, null, 2));
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

/**
 * Handles the `!search` command.
 * Searches advertisements for keywords in title or description.
 * @param {string[]} args - Command arguments: [keyword(s)].
 * @param {object} adsService - The `AdsNetworkService` instance.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleSearchAds = async (args, adsService, replyCallback) => {
    if (args.length < 1) {
        await replyCallback('Usage: `!search <keyword(s)>`\nThis will search for ads matching the keywords in their title or description.');
        return;
    }
    
    // Join all args to create the search term
    const searchTerm = args.join(' ').toLowerCase();
    
    try {
        const response = await adsService.getAllAdvertisements();
        
        // Handle different possible response formats
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
            await replyCallback('No advertisements available to search.');
            return;
        }
        
        // Filter ads by matching the search term in title or description
        const matchingAds = allAds.filter(ad => {
            const title = (ad.title || '').toLowerCase();
            const description = (ad.description || '').toLowerCase();
            return title.includes(searchTerm) || description.includes(searchTerm);
        });
        
        if (matchingAds.length === 0) {
            await replyCallback(`No advertisements found matching "${searchTerm}".`);
            return;
        }
        
        // Format response
        let reply = `*Search Results for "${searchTerm}"* (${matchingAds.length} found):\n\n`;
        matchingAds.forEach((ad) => {
            const adId = ad.id || ad._id;
            const title = ad.title || 'No title';
            const price = ad.price || 'Price not specified';
            const category = ad.category || 'No category';
            const shortDesc = ad.description ? 
                (ad.description.length > 100 ? ad.description.substring(0, 97) + '...' : ad.description) : 
                'No description';
                
            reply += `*ID:* ${adId}\n*Title:* ${title}\n*Price:* ${price}\n*Category:* ${category}\n*Description:* ${shortDesc}\n\n---\n\n`;
        });
        
        await replyCallback(reply);
    } catch (error) {
        console.error('[ERROR] handleSearchAds:', error);
        await replyCallback(`Failed to search advertisements: ${error.message}`);
    }
};

module.exports = {
    handleAllAds,
    handleViewAd,
    handleNearbyAds,
    handleSearchAds
};