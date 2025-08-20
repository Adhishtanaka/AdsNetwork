// src/services/adsNetworkService.js

const axios = require('axios');
const BASE_URL = 'http://localhost:8080'; // !! IMPORTANT: Replace with your actual AdsNetwork backend URL !!

class AdsNetworkService {
    constructor() {
        this.BASE_URL = BASE_URL; // Expose BASE_URL for help command reference
        this.client = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });
    }

    async _request(endpoint, method, body = null, token = null) {
        const options = {
            method: method,
            url: endpoint,
            data: body,
            headers: {}
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await this.client(options);
            return response.data;
        } catch (error) {
            // Handle axios errors
            if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
                console.error(`[NETWORK ERROR] Could not connect to AdsNetwork API at ${BASE_URL}:`, error.message);
                throw new Error(`Failed to connect to AdsNetwork API. Please ensure the backend is running at ${BASE_URL}.`);
            }

            if (error.response) {
                // Server responded with error status
                const data = error.response.data;
                let errorMessage = `API Error: ${error.response.status} ${error.response.statusText}`;
                
                if (data && data.message) {
                    errorMessage = data.message;
                } else if (data && typeof data === 'string') {
                    errorMessage = data;
                } else if (data && Array.isArray(data.errors) && data.errors.length > 0) {
                    errorMessage = data.errors.map(err => err.msg || err.message || JSON.stringify(err)).join('; ');
                } else if (data) {
                    errorMessage = JSON.stringify(data);
                }
                
                console.error(`[API CALL FAILED] ${method} ${endpoint}:`, errorMessage);
                throw new Error(errorMessage);
            }

            // Network or other error
            console.error(`[API CALL FAILED] ${method} ${endpoint}:`, error.message);
            throw error;
        }
    }

    // --- Browsing Advertisements ---
    async getAllAdvertisements() {
        return this._request('/advertisements', 'GET');
    }

    async getAdvertisementById(adId) {
        return this._request(`/advertisements/${adId}`, 'GET');
    }

    // --- WhatsApp Ad Management ---
    async getWhatsAppAdDetails() {
        return this._request('/advertisements/getWhatsAppAdDetails/', 'GET');
    }

    async boostWhatsAppAd(whatsAppId) {
        return this._request(`/advertisements/boostwhtsappid/${whatsAppId}`, 'POST');
    }
}

module.exports = AdsNetworkService;