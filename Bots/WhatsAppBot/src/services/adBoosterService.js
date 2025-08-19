const { MessageMedia } = require('whatsapp-web.js');
const { formatAdDetails } = require('../utils/helpers');

class AdBoosterService {
    constructor(client, adsService, notificationChatId) {
        this.client = client;
        this.adsService = adsService;
        this.notificationChatId = notificationChatId;
        this._pollInterval = null;
        this._maxRetries = 3;
        this._retryDelay = 5000; // 5 seconds
    }

    /**
     * Helper function to retry API calls with exponential backoff
     * @param {Function} apiCall - The API call function to retry
     * @param {number} maxRetries - Maximum number of retry attempts
     * @param {number} baseDelay - Base delay between retries in ms
     * @returns {Promise<any>} - Result of the API call
     */
    async _retryApiCall(apiCall, maxRetries = this._maxRetries, baseDelay = this._retryDelay) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await apiCall();
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
                    console.log(`[AdBooster] API call failed, retrying in ${delay/1000} seconds (attempt ${attempt + 1}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError; // If all retries fail, throw the last error
    }

    /**
     * Starts polling for non-boosted ads at the specified interval.
     * @param {number} intervalMs - The interval in milliseconds to check for non-boosted ads.
     */
    startPolling(intervalMs) {
        if (this._pollInterval) {
            console.log('[AdBooster] Polling already active.');
            return;
        }

        console.log(`[AdBooster] Starting ad boosting check every ${intervalMs / 1000} seconds.`);
        // Do an immediate check first
        this.checkForNonBoostedAds();
        // Then set up regular interval
        this._pollInterval = setInterval(() => this.checkForNonBoostedAds(), intervalMs);
    }

    /**
     * Stops polling for non-boosted ads.
     */
    stopPolling() {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = null;
            console.log('[AdBooster] Stopped ad boosting polling.');
        }
    }

    /**
     * Checks for non-boosted ads and boosts them.
     */
    async checkForNonBoostedAds() {
        try {
            console.log('[AdBooster] Checking for non-boosted ads...');
            const response = await this._retryApiCall(
                () => this.adsService.getWhatsAppAdDetails()
            );
            
            const whatsAppAdDetails = response.whatsAppAdDetails || [];
            
            // Filter non-boosted ads
            const nonBoostedAds = whatsAppAdDetails.filter(ad => !ad.boosted);
            
            if (nonBoostedAds.length === 0) {
                console.log('[AdBooster] No non-boosted ads found.');
                return;
            }
            
            console.log(`[AdBooster] Found ${nonBoostedAds.length} non-boosted ads. Processing...`);
            
            // Process each non-boosted ad
            for (const ad of nonBoostedAds) {
                try {
                    // Get full ad details
                    const adResponse = await this._retryApiCall(
                        () => this.adsService.getAdvertisementById(ad.whatsAppId)
                    );
                    
                    console.log(`[AdBooster] Processing ad ID: ${ad.whatsAppId}`);

                    // Send ad to channel
                    await this._sendAdToChannel(adResponse);
                    
                    // Boost the ad
                    await this._retryApiCall(
                        () => this.adsService.boostWhatsAppAd(ad.whatsAppId)
                    );
                    
                    console.log(`[AdBooster] Successfully boosted ad ID: ${ad.whatsAppId}`);
                } catch (error) {
                    console.error(`[AdBooster] Error processing ad ID ${ad.whatsAppId}:`, error.message);
                }
            }
        } catch (error) {
            console.error('[AdBooster] Error checking for non-boosted ads:', error.message);
        }
    }

    /**
     * Sends an ad to the configured chat channel.
     * @param {object} adResponse - The advertisement response object to send.
     */
    async _sendAdToChannel(adResponse) {
        // Extract the actual ad data from the response
        const ad = adResponse.ad || adResponse;
        
        console.log(`[AdBooster] Sending ad ID ${ad.id || 'unknown'} to channel...`);
        console.log(`[AdBooster] Notification chat ID: ${this.notificationChatId}`);
        
        if (!this.notificationChatId) {
            console.warn('[AdBooster] Notification chat ID not set. Cannot send boosted ad.');
            return;
        }

        const adDetails = await formatAdDetails(ad);
        let message = `🚀 *BOOSTED ADVERTISEMENT* 🚀\n\n${adDetails}`;
        let media = null;
        
        if (ad.photoUrls && ad.photoUrls.length > 0) {
            try {
                // Attempt to load media, allowing unsafe MIME types if necessary
                media = await MessageMedia.fromUrl(ad.photoUrls[0], { unsafeMime: true });
                console.log(`[AdBooster] Loaded photo for ad ${ad.id} from ${ad.photoUrls[0]}`);
            } catch (mediaError) {
                console.error(`[AdBooster] Failed to load media for ad ${ad.id}:`, mediaError.message);
                // Continue without media if there's an error
            }
        }

        try {
            // Send the message with or without media attachment
            await this.client.sendMessage(this.notificationChatId, media || message, media ? { caption: message } : {});
            console.log(`[AdBooster] Sent boosted ad ${ad.id} to ${this.notificationChatId}`);
        } catch (sendError) {
            console.error(`[AdBooster] Failed to send boosted ad ${ad.id} to ${this.notificationChatId}:`, sendError.message);
        }
    }
}

module.exports = AdBoosterService;
