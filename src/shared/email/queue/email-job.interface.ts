export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  payload: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
  idempotencyKey: string;
  retryCount: number;
  createdAt: Date;
}

export enum EmailPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}