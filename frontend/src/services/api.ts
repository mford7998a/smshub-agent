import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface Modem {
  id: number;
  port: string;
  phone_number: string | null;
  imei: string | null;
  iccid: string | null;
  status: 'active' | 'busy' | 'error' | 'offline';
  signal_quality: number | null;
  operator: string | null;
  country: string | null;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ModemStats {
  total_activations: number;
  active_activations: number;
  total_sms_sent: number;
  total_sms_received: number;
  uptime_minutes: number;
  signal_quality_avg: number;
}

export interface ModemWithStats extends Modem {
  stats: ModemStats;
}

export interface Activation {
  id: number;
  activation_id: string;
  modem_id: number;
  phone_number: string;
  service: string;
  status: number;
  operator: string;
  country: string;
  price: number;
  currency: number;
  created_at: string;
  updated_at: string;
}

export interface SMSMessage {
  id: number;
  sms_id: string;
  modem_id: number;
  activation_id: number;
  phone_from: string;
  phone_to: string;
  text: string;
  delivered: boolean;
  delivery_attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemMetrics {
  system: {
    cpu_percent: number;
    memory_percent: number;
    memory_used: number;
    memory_total: number;
    disk_percent: number;
    disk_used: number;
    disk_total: number;
    uptime_seconds: number;
  };
  process: {
    cpu_percent: number;
    memory_percent: number;
    memory_rss: number;
    threads: number;
    open_files: number;
    connections: number;
  };
}

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Load token from storage
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<string> {
    const response = await this.api.post<{ access_token: string }>('/auth/login', credentials);
    this.setToken(response.data.access_token);
    return response.data.access_token;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    this.clearToken();
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/users/me');
    return response.data;
  }

  // Modem endpoints
  async getModems(): Promise<Modem[]> {
    const response = await this.api.get<Modem[]>('/modems');
    return response.data;
  }

  async getModem(id: number): Promise<ModemWithStats> {
    const response = await this.api.get<ModemWithStats>(`/modems/${id}`);
    return response.data;
  }

  async createModem(data: Partial<Modem>): Promise<Modem> {
    const response = await this.api.post<Modem>('/modems', data);
    return response.data;
  }

  async updateModem(id: number, data: Partial<Modem>): Promise<Modem> {
    const response = await this.api.put<Modem>(`/modems/${id}`, data);
    return response.data;
  }

  async deleteModem(id: number): Promise<void> {
    await this.api.delete(`/modems/${id}`);
  }

  async connectModem(id: number): Promise<void> {
    await this.api.post(`/modems/${id}/connect`);
  }

  async disconnectModem(id: number): Promise<void> {
    await this.api.post(`/modems/${id}/disconnect`);
  }

  // Activation endpoints
  async getActivations(): Promise<Activation[]> {
    const response = await this.api.get<Activation[]>('/activations');
    return response.data;
  }

  async getActivation(id: string): Promise<Activation> {
    const response = await this.api.get<Activation>(`/activations/${id}`);
    return response.data;
  }

  async createActivation(data: Partial<Activation>): Promise<Activation> {
    const response = await this.api.post<Activation>('/activations', data);
    return response.data;
  }

  async updateActivation(id: string, status: number): Promise<Activation> {
    const response = await this.api.put<Activation>(`/activations/${id}`, { status });
    return response.data;
  }

  // SMS endpoints
  async getMessages(): Promise<SMSMessage[]> {
    const response = await this.api.get<SMSMessage[]>('/sms');
    return response.data;
  }

  async getMessage(id: string): Promise<SMSMessage> {
    const response = await this.api.get<SMSMessage>(`/sms/${id}`);
    return response.data;
  }

  async getUndeliveredMessages(): Promise<SMSMessage[]> {
    const response = await this.api.get<SMSMessage[]>('/sms/undelivered');
    return response.data;
  }

  // Monitoring endpoints
  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await this.api.get<SystemMetrics>('/monitoring/metrics');
    return response.data;
  }

  async getHealth(): Promise<Record<string, any>> {
    const response = await this.api.get('/monitoring/health');
    return response.data;
  }

  async getModemStats(): Promise<Record<string, any>> {
    const response = await this.api.get('/monitoring/stats/modems');
    return response.data;
  }

  async getActivationStats(): Promise<Record<string, any>> {
    const response = await this.api.get('/monitoring/stats/activations');
    return response.data;
  }

  async getSMSStats(): Promise<Record<string, any>> {
    const response = await this.api.get('/monitoring/stats/sms');
    return response.data;
  }

  async getHourlyStats(): Promise<Record<string, any>> {
    const response = await this.api.get('/monitoring/stats/hourly');
    return response.data;
  }

  async getErrorStats(): Promise<Record<string, any>> {
    const response = await this.api.get('/monitoring/stats/errors');
    return response.data;
  }
}

export const api = new ApiService(); 