import { SessionStatus, StudentSessionStatus, SubmissionStatus, UserRole } from '../constants/app.constants';

export interface Session {
  id: number;
  title: string;
  description?: string;
  order_index: number;
  status: SessionStatus;
  student_status?: StudentSessionStatus;
  recorded_date?: string | null;
  duration?: string;
  recording_link?: string;
  slide_link?: string;
  assets_link?: string;
  assignment_title?: string;
  assignment_description?: string;
  assignment_due_date?: string | null;
}

export interface Submission {
  id: string;
  session_id: number;
  student_id: string;
  student_name: string;
  pr_link: string;
  status: SubmissionStatus;
  feedback?: string;
  submitted_at: string;
  sessions?: Pick<Session, 'title' | 'order_index'>;
  showFeedback?: boolean;
}

export interface AdminStats {
  totalSessions: number;
  totalSubmissions: number;
  pendingReviews: number;
}

export interface UserRoleData {
  email: string;
  role: UserRole;
}

export interface CreateSessionData {
  title: string;
  description?: string;
  order_index: number;
  status: SessionStatus;
  student_status?: StudentSessionStatus;
  recorded_date?: string | null;
  duration?: string;
  recording_link?: string;
  slide_link?: string;
  assets_link?: string;
  assignment_title?: string;
  assignment_description?: string;
  assignment_due_date?: string | null;
}

export interface CreateSubmissionData {
  session_id: number;
  student_id: string;
  student_name: string;
  pr_link: string;
  status: SubmissionStatus;
}

