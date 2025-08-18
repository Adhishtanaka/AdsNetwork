const { MessageMedia } = require('whatsapp-web.js');
const { formatAdDetails } = require('../utils/helpers');

class AdNotifierService {
    constructor(client, adsService, notificationChatId) {
        this.client = client;
        this.adsService = adsService;
        this.notificationChatId = notificationChatId;
        this._knownAdIds = new Set();
        this._pollInterval = null;
        this._isInitialized = false;
        this._initializationAttempted = false;
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
                    console.log(`[AdNotifier] API call failed, retrying in ${delay/1000} seconds (attempt ${attempt + 1}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError; // If all retries fail, throw the last error
    }

    /**
     * Initializes the notifier by loading existing ad IDs without sending notifications.
     * Includes retry mechanism for API failures.
     */
    async initialize() {
        if (this._isInitialized) return;
        this._initializationAttempted = true;

        console.log('[AdNotifier] Initializing and loading existing ads...');
        try {
            const response = await this._retryApiCall(
                () => this.adsService.getAllAdvertisements()
            );
            
            // Handle various API response formats for the ads array
            const allAds = response.ads || response.advertisements || response.data || response;
            if (Array.isArray(allAds)) {
                allAds.forEach(ad => {
                    if (ad.id) {
                        this._knownAdIds.add(ad.id);
                    }
                });
                console.log(`[AdNotifier] Loaded ${this._knownAdIds.size} existing ads.`);
                this._isInitialized = true;
            } else {
                console.error('[AdNotifier] Unexpected format for initial ad load:', allAds);
            }
        } catch (error) {
            console.error('[AdNotifier] Failed to load initial ads after multiple retries:', error.message);
            // We'll continue with an empty set of known ads
            console.log('[AdNotifier] Continuing with empty set of known ads. New notifications may include existing ads.');
        }
    }

    /**
     * Starts polling for new ads at the specified interval.
     * @param {number} intervalMs - The interval in milliseconds to check for new ads.
     */
    startPolling(intervalMs) {
        if (!this._initializationAttempted) {
            console.warn('[AdNotifier] Not initialized. Calling initialize() first before starting polling.');
            this.initialize().finally(() => {
                this._startPollingInternal(intervalMs);
            });
        } else {
            this._startPollingInternal(intervalMs);
        }
    }

    /**
     * Internal method to start polling after initialization check
     * @param {number} intervalMs - The interval in milliseconds
     */
    _startPollingInternal(intervalMs) {
        if (this._pollInterval) {
            console.log('[AdNotifier] Polling already active.');
            return;
        }

        console.log(`[AdNotifier] Starting new ad check every ${intervalMs / 1000} seconds.`);
        // Do an immediate check first
        this.checkForNewAds();
        // Then set up regular interval
        this._pollInterval = setInterval(() => this.checkForNewAds(), intervalMs);
    }

    /**
     * Stops polling for new ads.
     */
    stopPolling() {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = null;
            console.log('[AdNotifier] Stopped new ad polling.');
        }
    }

    /**
     * Checks for new ads from the API and sends notifications for newly found ones.
     */
    async checkForNewAds() {
        try {
            console.log('[AdNotifier] Checking for new ads...');
            const response = await this._retryApiCall(
                () => this.adsService.getAllAdvertisements()
            );
            
            const allAds = response.ads || response.advertisements || response.data || response; // Handle various API response formats

            if (Array.isArray(allAds)) {
                let newAdsFound = 0;
                for (const ad of allAds) {
                    if (ad.id && !this._knownAdIds.has(ad.id)) {
                        this._knownAdIds.add(ad.id);
                        newAdsFound++;
                        console.log(`[AdNotifier] Found new ad: ${ad.title} (ID: ${ad.id})`);
                        await this._sendNewAdNotification(ad);
                    }
                }
                if (newAdsFound === 0) {
                    console.log('[AdNotifier] No new ads found.');
                } else {
                    console.log(`[AdNotifier] Sent notifications for ${newAdsFound} new ads.`);
                }
            } else {
                console.error('[AdNotifier] Unexpected API response format during check:', allAds);
            }
        } catch (error) {
            console.error('[AdNotifier] Error checking for new ads:', error.message);
        }
    }

    /**
     * Sends a notification for a new ad to the configured chat ID.
     * @param {object} ad - The new advertisement object.
     */
    async _sendNewAdNotification(ad) {
        if (!this.notificationChatId) {
            console.warn('[AdNotifier] Notification chat ID not set. Cannot send new ad alert.');
            return;
        }

        const adDetails = formatAdDetails(ad);
        let media = null;
        if (ad.photoUrls && ad.photoUrls.length > 0) {
            try {
                // Attempt to load media, allowing unsafe MIME types if necessary
                media = await MessageMedia.fromUrl(ad.photoUrls[0], { unsafeMime: true });
                console.log(`[AdNotifier] Loaded photo for ad ${ad.id} from ${ad.photoUrls[0]}`);
            } catch (mediaError) {
                console.error(`[AdNotifier] Failed to load media for ad ${ad.id}:`, mediaError.message);
                // Continue without media if there's an error
            }
        }

        try {
            // Send the message with or without media attachment
            await this.client.sendMessage(this.notificationChatId, media || adDetails, media ? { caption: adDetails } : {});
            console.log(`[AdNotifier] Sent notification for ad ${ad.id} to ${this.notificationChatId}`);
        } catch (sendError) {
            console.error(`[AdNotifier] Failed to send new ad notification for ad ${ad.id} to ${this.notificationChatId}:`, sendError.message);
        }
    }
}

module.exports = AdNotifierService;