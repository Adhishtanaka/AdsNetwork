
// src/services/adsNetworkService.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8080'; // !! IMPORTANT: Replace with your actual AdsNetwork backend URL !!

class AdsNetworkService {
    constructor() {
        this.BASE_URL = BASE_URL; // Expose BASE_URL for help command reference
    }

    async _request(endpoint, method, body = null, token = null) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method: method,
            headers: headers
        };

        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, options);
            const data = await response.json();

            if (!response.ok) {
                let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                if (data && data.message) {
                    errorMessage = data.message;
                } else if (data && typeof data === 'string') {
                    errorMessage = data;
                } else if (data && Array.isArray(data.errors) && data.errors.length > 0) {
                    // Handle validation errors or multiple error messages from backend
                    errorMessage = data.errors.map(err => err.msg || err.message || JSON.stringify(err)).join('; ');
                } else if (data) {
                    errorMessage = JSON.stringify(data); // Fallback for unexpected JSON error structure
                }
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            // Check for network-level errors (e.g., backend not running)
            if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
                console.error(`[NETWORK ERROR] Could not connect to AdsNetwork API at ${BASE_URL}:`, error.message);
                throw new Error(`Failed to connect to AdsNetwork API. Please ensure the backend is running at ${BASE_URL}.`);
            }
            // Re-throw API-specific errors after logging
            console.error(`[API CALL FAILED] ${method} ${endpoint}:`, error.message);
            throw error;
        }
    }

    // --- Authentication Endpoints ---

    async login(email, password, location) {
        const body = { email, password, location };
        return this._request('/auth/login', 'POST', body);
    }

    async getUserProfile(token) {
        return this._request('/auth/profile', 'GET', null, token);
    }

    // --- Browsing Advertisements ---

    async getAllAdvertisements() {
        return this._request('/advertisements', 'GET');
    }

    async getAdvertisementById(adId) {
        return this._request(`/advertisements/${adId}`, 'GET');
    }

    // --- Interacting with Advertisements (as a Buyer) ---

    async addCommentToAdvertisement(commentData, token) {
        return this._request('/comments', 'POST', commentData, token);
    }

    async getAllComments() {
        return this._request('/comments', 'GET');
    }

    async getCommentsForAdvertisement(adId) {
        return this._request(`/comments/ad/${adId}`, 'GET');
    }
}

module.exports = AdsNetworkService;