const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, token } = options;
    const authToken = token || this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  // Auth
  async signup(name: string, email: string, password: string, role: 'brand' | 'creator') {
    return this.request('/auth/signup', {
      method: 'POST',
      body: { name, email, password, role },
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  // Campaigns
  async getCampaigns() {
    return this.request('/campaigns');
  }

  async getMyCampaigns() {
    return this.request('/campaigns/my');
  }

  async getCampaign(id: string) {
    return this.request(`/campaigns/${id}`);
  }

  async createCampaign(data: {
    name: string;
    platform: 'instagram' | 'youtube';
    totalBudget: number;
    milestones: { views: number; payout: number }[];
  }) {
    return this.request('/campaigns', {
      method: 'POST',
      body: data,
    });
  }

  // Submissions
  async getMySubmissions() {
    return this.request('/submissions/my');
  }

  async getCampaignSubmissions(campaignId: string) {
    return this.request(`/submissions/campaign/${campaignId}`);
  }

  async createSubmission(postLink: string, campaignId: string) {
    return this.request('/submissions', {
      method: 'POST',
      body: { postLink, campaignId },
    });
  }

  async updateViews(submissionId: string, viewCount: number) {
    return this.request(`/submissions/${submissionId}/views`, {
      method: 'PATCH',
      body: { viewCount },
    });
  }
}

export const api = new ApiClient(API_BASE);
