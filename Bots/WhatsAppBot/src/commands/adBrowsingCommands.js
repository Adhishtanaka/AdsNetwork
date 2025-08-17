// src/commands/adBrowsingCommands.js

const { formatAdDetails } = require('../utils/helpers');

/**
 * Handles the `!all_ads` command.
 * Retrieves and displays all available advertisements.
 * @param {object} adsService - The `AdsNetworkService` instance.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleAllAds = async (adsService, replyCallback) => {
    try {
        const allAds = await adsService.getAllAdvertisements();
        if (allAds.length === 0) {
            await replyCallback('No advertisements available yet.');
        } else {
            let reply = '*All Advertisements:*\n\n';
            allAds.forEach(ad => {
                reply += `*ID:* ${ad.id}\n*Title:* ${ad.title}\n*Price:* ${ad.price}\n*Category:* ${ad.category}\n*Location:* ${ad.location.name}\n*Posted by:* ${ad.userEmail}\n\n---\n\n`;
            });
            await replyCallback(reply);
        }
    } catch (error) {
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
        const ad = await adsService.getAdvertisementById(adId_view);
        await replyCallback(formatAdDetails(ad));
    } catch (error) {
        await replyCallback(`Failed to view ad: ${error.message}`);
    }
};

module.exports = {
    handleAllAds,
    handleViewAd,
};