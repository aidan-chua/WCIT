import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Types for our data structures
export interface AlternativeBreed {
  breed: string;
  percentage: number;
}

export interface CatIdentification {
  id: string;
  imageUrl: string;
  breedName: string;
  confidence: number;
  alternativeBreeds: AlternativeBreed[];
  funFacts: string[];
  createdAt: string;
}

// Generate device ID if not exists
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// API client with device ID
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add device ID to all requests
api.interceptors.request.use((config) => {
  const deviceId = getDeviceId();
  config.headers['X-Device-Id'] = deviceId;
  return config;
});

// Mock data for development (remove when backend is ready)
const mockCatIdentifications: CatIdentification[] = [
  {
    id: '1',
    imageUrl: 'https://via.placeholder.com/300',
    breedName: 'American Shorthair',
    confidence: 85,
    alternativeBreeds: [
      { breed: 'British Shorthair', percentage: 10 },
      { breed: 'Domestic Shorthair', percentage: 5 },
    ],
    funFacts: [
      'American Shorthairs are known for their longevity, often living 15-20 years.',
      'They were originally brought to America on ships to control rodent populations.',
      'They have a calm and friendly temperament, making them great family pets.',
    ],
    createdAt: new Date().toISOString(),
  },
];

export const apiService = {
  // Upload image and identify breed
  uploadImage: async (file: File): Promise<CatIdentification> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Mock response for development
      console.log('Using mock data - backend not connected');
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: Date.now().toString(),
            imageUrl: URL.createObjectURL(file),
            breedName: 'American Shorthair',
            confidence: 85,
            alternativeBreeds: [
              { breed: 'British Shorthair', percentage: 10 },
              { breed: 'Domestic Shorthair', percentage: 5 },
            ],
            funFacts: [
              'American Shorthairs are known for their longevity, often living 15-20 years.',
              'They were originally brought to America on ships to control rodent populations.',
              'They have a calm and friendly temperament, making them great family pets.',
            ],
            createdAt: new Date().toISOString(),
          });
        }, 1500);
      });
    }
  },

  // Get all cat identifications for current session
  getCats: async (): Promise<CatIdentification[]> => {
    try {
      const response = await api.get('/cats');
      return response.data;
    } catch (error) {
      // Mock response for development
      console.log('Using mock data - backend not connected');
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockCatIdentifications);
        }, 500);
      });
    }
  },

  // Get specific cat identification
  getCat: async (id: string): Promise<CatIdentification> => {
    try {
      const response = await api.get(`/cats/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

