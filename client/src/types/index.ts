// src/types/index.ts

export interface Farmer {
  id?: string;
  name: string;
  email: string;
  location?: string;
  cropsInterested?: string[];
}

export interface DiseaseReport {
  id: string;
  diseaseName: string;
  symptoms: string;
  treatment: string;
  prevention: string;
  createdAt: string;
}

export interface WeatherData {
  weather: {
    main: {
      temp: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
  };
  rainfallProbability?: boolean;
}

export interface Scheme {
  name: string;
  category: string;
  state: string;
  detail: string;
  eligibility: string;
  link: string;
}

export interface MarketPriceItem {
  crop: string;
  market: string;
  state: string;
  season: string;
  price: number;
  trend: number;
  arrival: string;
}

export interface Farm {
  id?: string;
  name: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  crop: string;
  cropVariety?: string;
  soilType: string;
  area: string;
  sowingDate: string;
  expectedHarvest?: string;
  irrigationMethod?: string;
  notes?: string;
  // Computed by server
  stage?: string;
  daysElapsed?: number;
  diseaseHistory?: Array<{ id: string; disease_name: string; crop?: string; confidence?: number; created_at: string }>;
  createdAt?: string;
}

export type AlertSeverity = 'low' | 'medium' | 'high';
export type AlertCategory = 'weather' | 'disease' | 'crop' | 'market';

export interface Alert {
  id: string;
  userId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  isRead: boolean;
  createdAt: string;
}
