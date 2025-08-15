
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
