import axios from 'axios';
import { storageService } from './appwrite';
import type { AdData, ApiResponse, CreateCommentRequest } from '../constants/types';
import ngeohash from "ngeohash";

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://localhost:8080';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

async login(email: string, password: string, location: { lat: number; lng: number }) {
  const geohash = ngeohash.encode(location.lat, location.lng); // compute geohash
  const response = await axios.post(`${this.baseUrl}/auth/login`, {
    email,
    password,
    location: {
      name: "",
      lat: location.lat,
      lng: location.lng,
      geohash
    }
  });
  return response.data;
}

  

  async signup(
    username: string,
    email: string,
    password: string,
    location: { lat: number; lng: number },
    phone: string
  ) {
    const geohash = ngeohash.encode(location.lat, location.lng); // compute geohash
    const response = await axios.post(`${this.baseUrl}/auth/register`, {
      username,
      email,
      password,
      location: {
        name: "",
        lat: location.lat,
        lng: location.lng,
        geohash
      },
      phone
    });
    
    return response.data;
  }

  async getProfile() {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error('Not authenticated');

    const response = await axios.get(`${this.baseUrl}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  }

  async createAdvertisement(adData: AdData): Promise<ApiResponse<AdData>> {
    const token = localStorage.getItem('jwt');
    return this.request('/advertisements', {
      method: 'POST',
      body: JSON.stringify(adData),
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });
  }

  async getAdvertisements(params?: {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') queryParams.append(key, value.toString());
      });
    }

    const endpoint = `/advertisements${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async getAdvertisement(id: string): Promise<ApiResponse<Any>> {
    return this.request(`/advertisements/${id}`);
  }

  async updateAdvertisement(id: string, adData: Partial<AdData>): Promise<ApiResponse<AdData>> {
    const token = localStorage.getItem('jwt');
    return this.request(`/advertisements/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(adData),
    });
  }

  async deleteAdvertisement(id: string): Promise<ApiResponse<void>> {
    const token = localStorage.getItem('jwt');
    return this.request(`/advertisements/${id}`, { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  async getUserAdvertisements(): Promise<ApiResponse<AdData[]>> {
    const token = localStorage.getItem('jwt');
    return this.request('/advertisements/my-ads', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  async boostAdvertisement(id: string): Promise<ApiResponse<void>> {
    const token = localStorage.getItem('jwt');
    return this.request(`/advertisements/${id}/boost`, { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
  
  async createComment(commentData: CreateCommentRequest){
    const token = localStorage.getItem('jwt');
    return this.request('/comments', {
      body:JSON.stringify(commentData),
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  async deleteComment(id: string ){
    const token = localStorage.getItem('jwt');
    return this.request(`/comments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  async createAdvertisementWithImages(
    formData: Omit<AdData, 'photoUrls'>,
    images: File[]
  ): Promise<ApiResponse<AdData>> {
    try {
      const photoUrls = await storageService.uploadMultipleFiles(images);

      const adData: AdData = { ...formData, photoUrls };
      return this.createAdvertisement(adData);
    } catch (error) {
      console.error('Error creating advertisement with images:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create advertisement',
      };
    }
  }
}

export const apiService = new ApiService();

export type { AdData, ApiResponse };
