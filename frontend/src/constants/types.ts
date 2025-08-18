
export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  geohash: string;
}

export interface AdData {
  title: string;
  description: string;
  price: string;
  location: LocationData;
  category: string;
  photoUrls: string[];
  userEmail: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Photo {
  file: File;
  url: string;
  id: string;
}


export interface FormDataType {
  title: string;
  description: string;
  price: string;
  location: string; 
  category: string;
  photos: Photo[];
}

export interface SubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  progress: string;
}

export interface Comment {
  id: number;           
  userEmail: string;    
  adId: number;         
  sentiment: string;
  description: string;  
  createdAt: string;    
}


export interface Location {
  name: string;
  lat: number;
  lng: number;
  geohash: string;
}

export interface Ad {
  id:number
  title: string;
  description: string;
  price: string;
  location: Location;
  category: string;
  userEmail: string;
  photoUrls: string[];
  date?: string;
  comments?: Comment[];
  sellerPhone?: string
}

export interface AdApiResponse {
  message: string;
  ads: Ad[];
}

export type CreateCommentRequest = {
  ad_id: number;
  sentiment: string;
  description: string;
};

export type SentimentType = 'good' | 'bad' | 'neutral';

// types/admin.ts
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  location: {
    name: string;
    lat: number;
    lng: number;
    geohash: string;
  };
  whatsappNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAd {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  location: {
    name: string;
    lat: number;
    lng: number;
    geohash: string;
  };
  photoUrls: string[];
  userId: number;
  userName: string;
  userEmail: string;
  score: number; // +1 for good, -1 for bad, 0 for neutral
  createdAt: string;
  updatedAt: string;
}

export interface AdminComment {
  id: number;
  content: string;
  userId: number;
  userName: string;
  userEmail: string;
  adId: number;
  adTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalAds: number;
  totalComments: number;
}

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AdminUsersResponse {
  message: string;
  totalUsers: number;
  users: AdminUser[];
}

export interface AdminAdsResponse {
  message: string;
  totalAds: number;
  ads: AdminAd[];
}

export interface AdminCommentsResponse {
  message: string;
  totalComments: number;
  comments: AdminComment[];
}

export interface DeleteResponse {
  message: string;
  userId?: string;
  adId?: string;
  commentId?: string;
}
