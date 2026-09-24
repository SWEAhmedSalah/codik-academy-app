import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environment/environment';
import {
  Session,
  Submission,
  AdminStats,
  CreateSessionData,
  CreateSubmissionData,
  BugReportData,
  Course,
  CourseSection
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

  /**
   * Get Supabase client for realtime subscriptions
   */
  getClient(): SupabaseClient {
    return this.supabase;
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

  // ================= Course Management =================

  /**
   * Get all courses
   */
  async getAllCourses(): Promise<Course[]> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
    return (data || []) as Course[];
  }

  /**
   * Get course details by ID
   */
  async getCourseDetails(courseId: number): Promise<Course | null> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching course details:', error);
      throw error;
    }
    return (data as Course | null) || null;
  }

  /**
   * Create a course
   */
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const payload = {
      ...courseData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('courses')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      throw error;
    }
    return data as Course;
  }

  /**
   * Update a course
   */
  async updateCourse(courseId: number, courseData: Partial<Course>): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .update({
        ...courseData,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      throw error;
    }
    return data as Course;
  }

  /**
   * Delete a course
   */
  async deleteCourse(courseId: number): Promise<void> {
    const { error } = await this.supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Duplicate a course with its sections and lessons
   */
  async duplicateCourse(courseId: number): Promise<Course> {
    const originalCourse = await this.getCourseDetails(courseId);
    if (!originalCourse) {
      throw new Error('Course not found');
    }

    const slugBase = (originalCourse.slug || originalCourse.title || 'course')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, '-')
      .replace(/[^\w\-أ-ي]+/g, '')
      .replace(/\-\-+/g, '-');

    const duplicatedCourse = await this.createCourse({
      title: `${originalCourse.title} (Copy)`,
      slug: slugBase ? `${slugBase}-copy-${Date.now()}` : null,
      description: originalCourse.description ?? null,
      thumbnail_url: originalCourse.thumbnail_url ?? null,
      category: originalCourse.category ?? null,
      difficulty_level: originalCourse.difficulty_level ?? null,
      course_type: originalCourse.course_type ?? null,
      price: originalCourse.price ?? 0,
      is_free: originalCourse.is_free ?? true,
      instructor_name: originalCourse.instructor_name ?? null,
      status: 'Draft',
      rating: originalCourse.rating ?? 0,
      course_duration_hours: originalCourse.course_duration_hours ?? 0,
      learning_objectives: originalCourse.learning_objectives ?? [],
      total_students: 0,
      total_lessons: 0,
      total_sections: 0
    });

    const originalSections = await this.getCourseSections(courseId);
    for (const section of originalSections) {
      const newSection = await this.createCourseSection({
        course_id: duplicatedCourse.id,
        title: section.title,
        description: section.description ?? undefined,
        order_index: section.order_index
      });

      const sectionLessons = await this.getSessionsBySection(section.id);
      for (const lesson of sectionLessons) {
        const lessonData: CreateSessionData = {
          title: lesson.title,
          description: lesson.description,
          order_index: lesson.order_index,
          course_id: duplicatedCourse.id,
          section_id: newSection.id,
          is_preview: lesson.is_preview ?? false,
          content_type: lesson.content_type ?? 'video',
          status: lesson.status,
          student_status: lesson.student_status,
          recorded_date: lesson.recorded_date,
          duration: lesson.duration,
          recording_link: lesson.recording_link,
          slide_link: lesson.slide_link,
          assets_link: lesson.assets_link,
          assignment_title: lesson.assignment_title,
          assignment_description: lesson.assignment_description,
          assignment_due_date: lesson.assignment_due_date,
          is_locked: lesson.is_locked
        };

        await this.addSession(lessonData);
      }
    }

    return duplicatedCourse;
  }

  /**
   * Quick toggle course status
   */
  async quickToggleCourseStatus(courseId: number): Promise<Course> {
    const course = await this.getCourseDetails(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const nextStatus = course.status === 'Published' ? 'Draft' : 'Published';
    return this.updateCourse(courseId, { status: nextStatus });
  }

  // ================= Course Sections Management =================

  /**
   * Get sections for a course ordered by index
   */
  async getCourseSections(courseId: number): Promise<CourseSection[]> {
    const { data, error } = await this.supabase
      .from('course_sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching course sections:', error);
      throw error;
    }
    return (data || []) as CourseSection[];
  }

  /**
   * Create a course section
   */
  async createCourseSection(sectionData: {
    course_id: number;
    title: string;
    description?: string;
    order_index: number;
  }): Promise<CourseSection> {
    const payload = {
      ...sectionData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('course_sections')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating course section:', error);
      throw error;
    }
    return data as CourseSection;
  }

  /**
   * Update a course section
   */
  async updateCourseSection(sectionId: number, updates: Partial<CourseSection>): Promise<CourseSection> {
    const { data, error } = await this.supabase
      .from('course_sections')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating course section:', error);
      throw error;
    }
    return data as CourseSection;
  }

  /**
   * Delete a course section
   */
  async deleteCourseSection(sectionId: number): Promise<void> {
    const { error } = await this.supabase
      .from('course_sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      console.error('Error deleting course section:', error);
      throw error;
    }
  }

  /**
   * Reorder a course section
   */
  async reorderCourseSection(sectionId: number, newOrderIndex: number): Promise<CourseSection> {
    const { data, error } = await this.supabase
      .from('course_sections')
      .update({
        order_index: newOrderIndex,
        updated_at: new Date().toISOString()
      })
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('Error reordering course section:', error);
      throw error;
    }
    return data as CourseSection;
  }

  /**
   * Get sessions for a specific section
   */
  async getSessionsBySection(sectionId: number): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching section lessons:', error);
      throw error;
    }
    return (data || []) as Session[];
  }

  /**
   * Get curriculum data for a course
   */
  async getCourseCurriculum(courseId: number): Promise<{
    course: Course;
    sections: CourseSection[];
    lessons: Session[];
  }> {
    const course = await this.getCourseDetails(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const [sections, lessons] = await Promise.all([
      this.getCourseSections(courseId),
      this.supabase
        .from('sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('section_id', { ascending: true, nullsFirst: true })
        .order('order_index', { ascending: true })
    ]);

    if (lessons.error) {
      console.error('Error fetching course curriculum lessons:', lessons.error);
      throw lessons.error;
    }

    return {
      course,
      sections,
      lessons: (lessons.data || []) as Session[]
    };
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

  /**
   * Delete a submission (revert)
   * Students can only delete their own pending submissions before the deadline
   */
  async deleteSubmission(id: number): Promise<void> {
    console.log('🗑️ Attempting to delete submission with ID:', id);

    const { data, error } = await this.supabase
      .from('submissions')
      .delete()
      .eq('id', id)
      .select(); // Get deleted row to confirm

    if (error) {
      console.error('❌ Error deleting submission:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No rows deleted. Possible RLS policy issue.');
      throw new Error('Failed to delete submission. You may not have permission or the submission does not exist.');
    }

    console.log('✅ Submission deleted successfully:', data);
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
