export interface User {
  id: string;
  name: string;
  email: string;
  role: 'brand' | 'creator';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Milestone {
  views: number;
  payout: number;
}

export interface Campaign {
  _id: string;
  slug?: string;
  name: string;
  platform: 'instagram' | 'youtube';
  totalBudget: number;
  budgetSpent: number;
  milestones: Milestone[];
  status: 'live' | 'completed';
  remainingBudget: number;
  brand: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  postLink: string;
  platform: 'instagram' | 'youtube';
  viewCount: number;
  currentMilestoneIndex: number;
  totalPaid: number;
  campaign: Campaign;
  creator: {
    _id: string;
    name: string;
    email: string;
  };
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
