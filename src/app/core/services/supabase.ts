import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environment/environment';
import {
  Session,
  Submission,
  AdminStats,
  CreateSessionData,
  CreateSubmissionData,
  BugReportData
} from '../models/session.model';
import { UserRole, SubmissionStatus, SessionStatus } from '../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ================= Session Management =================

  /**
   * Get all sessions ordered by index
   */
  async getSessions(): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
    return data as Session[];
  }

  /**
   * Get only published sessions (for student view)
   */
  async getPublishedSessions(): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('status', SessionStatus.PUBLISHED)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching published sessions:', error);
      throw error;
    }
    return data as Session[];
  }

  /**
   * Add a new session
   */
  async addSession(sessionData: CreateSessionData): Promise<Session> {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      console.error('Error adding session:', error);
      throw error;
    }
    return data as Session;
  }

  /**
   * Update an existing session
   */
  async updateSession(id: number, sessionData: Partial<CreateSessionData>): Promise<Session> {
    const { data, error } = await this.supabase
      .from('sessions')
      .update(sessionData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      throw error;
    }
    return data as Session;
  }

  /**
   * Delete a session by ID
   */
  async deleteSession(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // ================= Submission Management =================

  /**
   * Submit a new assignment
   */
  async submitTask(taskData: CreateSubmissionData): Promise<Submission> {
    const { data, error } = await this.supabase
      .from('submissions')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('Error submitting task:', error);
      throw error;
    }
    return data as Submission;
  }

  /**
   * Get all submissions (for admin view) with related session info
   */
  async getAllSubmissions(): Promise<Submission[]> {
    const { data, error } = await this.supabase
      .from('submissions')
      .select(`
        *,
        sessions ( title, order_index )
      `)
      .order('submitted_at', { ascending: false })
      .range(0, 9999);

    if (error) {
      console.error('Error fetching all submissions:', error);
      throw error;
    }
    return data as Submission[];
  }

  /**
   * Get submissions for a specific student by name
   */
  async getStudentSubmissions(studentName: string): Promise<Submission[]> {
    const { data, error } = await this.supabase
      .from('submissions')
      .select('*, sessions(title, order_index)')
      .eq('student_name', studentName)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching student submissions:', error);
      throw error;
    }
    return (data as Submission[]) || [];
  }

  /**
   * Update submission status and feedback
   * Uses RPC function to bypass RLS restrictions
   */
  async updateSubmission(
    id: number,
    status: SubmissionStatus,
    feedback: string
  ): Promise<void> {
    const { error } = await this.supabase.rpc('update_submission_status', {
      submission_id: id,
      new_status: status,
      new_feedback: feedback
    });

    if (error) {
      console.error('Error updating submission:', error);
      throw error;
    }
  }

  /**
   * Resubmit assignment (reset status to Pending and update PR link)
   * Uses RPC to bypass RLS restrictions
   */
  async resubmitTask(id: number, prLink: string, sessionId: number, studentName: string): Promise<void> {
    const { error } = await this.supabase.rpc('update_submission_status', {
      submission_id: id,
      new_status: SubmissionStatus.PENDING,
      new_feedback: '',
      new_pr_link: prLink
    });

    if (error) {
      console.error('Error resubmitting task:', error);
      throw error;
    }
  }

  // ================= Bug Reports =================

  /**
   * Submit a bug report
   */
  async submitBugReport(report: {
    title: string;
    description: string;
    category: string;
    reported_by: string;
    email: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('bug_reports')
      .insert([report]);

    if (error) {
      console.error('Error submitting bug report:', error);
      throw error;
    }
  }

  /**
   * Get all bug reports (admin)
   */
  async getBugReports(): Promise<BugReportData[]> {
    const { data, error } = await this.supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bug reports:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Update bug report status
   */
  async updateBugReportStatus(id: number, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('bug_reports')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating bug report status:', error);
      throw error;
    }
  }

  /**
   * Delete a bug report
   */
  async deleteBugReport(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('bug_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bug report:', error);
      throw error;
    }
  }

  // ================= Statistics =================

  /**
   * Get admin dashboard statistics
   */
  async getAdminDashboardStats(): Promise<AdminStats> {
    const { count: sessionsCount, error: err1 } = await this.supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });

    const { count: submissionsCount, error: err2 } = await this.supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    const { count: pendingCount, error: err3 } = await this.supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', SubmissionStatus.PENDING);

    if (err1 || err2 || err3) {
      console.error('Error fetching stats:', err1 || err2 || err3);
      throw new Error('Error fetching stats');
    }

    return {
      totalSessions: sessionsCount || 0,
      totalSubmissions: submissionsCount || 0,
      pendingReviews: pendingCount || 0
    };
  }

  // ================= Authentication =================

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ user: User }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }

    return { user: data.user };
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  /**
   * Get user role from database
   * @returns UserRole enum value (defaults to STUDENT if not found)
   */
  async getUserRole(email: string): Promise<UserRole> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('email', email)
      .single();

    if (error || !data) {
      return UserRole.STUDENT;
    }
    return data.role as UserRole;
  }

}
