import {
  AttendanceStatus,
  SessionStatus,
  StudentSessionStatus,
  SubmissionStatus,
  UserRole
} from '../constants/app.constants';

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
  is_locked?: boolean;
  course_id?: number | null;
  section_id?: number | null;
  is_preview?: boolean;
  content_type?: 'video' | 'live' | 'article' | 'quiz' | 'assignment' | string | null;
}

export interface Submission {
  id: number;
  session_id: number;
  student_name: string;
  pr_link: string;
  status: SubmissionStatus;
  feedback?: string;
  submitted_at: string;
  sessions?: Pick<Session, 'title' | 'order_index'>;
  showFeedback?: boolean;
}

export interface Attendance {
  id: number;
  session_id: number;
  student_name: string;
  status: AttendanceStatus;
  marked_at: string;
  sessions?: Pick<Session, 'title' | 'order_index'>;
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
  is_locked?: boolean;
  course_id?: number | null;
  section_id?: number | null;
  is_preview?: boolean;
  content_type?: 'video' | 'live' | 'article' | 'quiz' | 'assignment' | string | null;
}

export interface CreateSubmissionData {
  session_id: number;
  student_name: string;
  pr_link: string;
  status: SubmissionStatus;
}

export interface BugReportData {
  id: number;
  title: string;
  description: string;
  category: string;
  reported_by: string;
  email: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  slug?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  category?: string | null;
  difficulty_level?: string | null;
  course_type?: string | null;
  price?: number | null;
  is_free?: boolean | null;
  instructor_name?: string | null;
  status: SessionStatus | string;
  rating?: number | null;
  total_students?: number | null;
  total_lessons?: number | null;
  course_duration_hours?: number | null;
  total_sections?: number | null;
  learning_objectives?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface CourseSection {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  order_index: number;
  total_lessons?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumNode {
  type: 'section' | 'lesson';
  data: CourseSection | Session;
  children?: CurriculumNode[];
  expanded?: boolean;
  visible: boolean;
}
