/**
 * Admin Model - Admin-related data interfaces
 */

export interface DashboardStats {
  totalMessages: number;
  resolvedPercentage: number;
  avgResponseTime: number;
  documentsIndexed: number;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  type: 'message' | 'escalation' | 'document_uploaded' | 'document_indexed';
  description: string;
  timestamp: Date;
}
