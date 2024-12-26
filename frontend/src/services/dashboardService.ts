import { api } from './api';

export interface DashboardData {
  modems: {
    total: number;
    active: number;
    busy: number;
    offline: number;
    by_country: Record<string, number>;
    by_operator: Record<string, number>;
  };
  activations: {
    total: number;
    pending: number;
    completed: number;
    success_rate: number;
    by_service: Record<string, number>;
    by_status: Record<string, number>;
    daily_activations: Record<string, number>;
  };
  messages: {
    total: number;
    delivered: number;
    pending: number;
    delivery_rate: number;
    daily_messages: Record<string, number>;
    avg_delivery_time: number;
  };
  revenue: {
    total_rub: number;
    total_usd: number;
    daily_revenue: Record<string, { RUB: number; USD: number }>;
    by_service: Record<string, { RUB: number; USD: number }>;
  };
  last_updated: string;
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await api.get<DashboardData>('/api/dashboard');
  return response.data;
}; 