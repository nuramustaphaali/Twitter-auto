export enum Tone {
  PROFESSIONAL = 'Professional',
  CASUAL = 'Casual',
  HUMOROUS = 'Humorous',
  CONTROVERSIAL = 'Controversial',
  INSPIRATIONAL = 'Inspirational',
  TECHNICAL = 'Technical'
}

export enum PostStatus {
  GENERATED = 'GENERATED',
  SCHEDULED = 'SCHEDULED',
  POSTED = 'POSTED',
  FAILED = 'FAILED'
}

export interface UserProfile {
  handle: string;
  name: string;
  avatarUrl: string;
  isConnected: boolean;
  interests: string[];
  language: string;
  preferredTone: Tone;
  autoPilot: boolean;
}

export interface Tweet {
  id: string;
  content: string;
  status: PostStatus;
  scheduledTime?: string; // ISO string
  createdAt: string;
  likes?: number;
  retweets?: number;
}

export interface GeneratedContent {
  tweets: string[];
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}