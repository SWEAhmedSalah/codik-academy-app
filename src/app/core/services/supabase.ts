import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environment/environment';
import {
  Attendance,
  Course,
  CourseSection,
  Session,
  Submission,
  AdminStats,
  CreateSessionData,
  CreateSubmissionData,
  BugReportData
} from '../models/session.model';
import { AttendanceStatus, UserRole, SubmissionStatus, SessionStatus } from '../constants/app.constants';

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

  // ================= Attendance Management =================

  async getStudentRoster(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('email, role');

    if (error) {
      console.error('Error fetching student roster:', error);
      throw error;
    }

    return (data || [])
      .filter(user => user.email && user.role?.toLowerCase() !== UserRole.ADMIN)
      .map(user => user.email)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  async getAllAttendance(): Promise<Attendance[]> {
    const { data, error } = await this.supabase
      .from('attendance')
      .select('*');

    if (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }

    return (data as Attendance[]) || [];
  }

  async getSessionAttendance(sessionId: number): Promise<Attendance[]> {
    const { data, error } = await this.supabase
      .from('attendance')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error fetching session attendance:', error);
      throw error;
    }

    return (data as Attendance[]) || [];
  }

  async markAttendance(sessionId: number, studentName: string, status: AttendanceStatus): Promise<void> {
    const { error } = await this.supabase.rpc('mark_attendance', {
      p_session_id: sessionId,
      p_student_name: studentName,
      p_status: status
    });

    if (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async getStudentAttendance(studentName: string): Promise<Attendance[]> {
    const { data, error } = await this.supabase
      .from('attendance')
      .select('*, sessions(title, order_index)')
      .eq('student_name', studentName);

    if (error) {
      console.error('Error fetching student attendance:', error);
      throw error;
    }

    return (data as Attendance[]) || [];
  }

  // ================= Course Management =================

  async getAllCourses(): Promise<Course[]> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }

    return (data as Course[]) || [];
  }

  async getCourseDetails(courseId: number): Promise<Course | null> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error fetching course details:', error);
      throw error;
    }

    return data as Course;
  }

  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      throw error;
    }

    return data as Course;
  }

  async updateCourse(courseId: number, courseData: Partial<Course>): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      throw error;
    }

    return data as Course;
  }

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

  async duplicateCourse(courseId: number): Promise<Course> {
    const course = await this.getCourseDetails(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const sections = await this.getCourseSections(courseId);
    const { data: lessons, error: lessonsError } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (lessonsError) {
      console.error('Error loading lessons for course duplication:', lessonsError);
      throw lessonsError;
    }

    const duplicatePayload: Partial<Course> = {
      title: `${course.title} (Copy)`,
      slug: course.slug ? `${course.slug}-copy-${Date.now()}` : null,
      description: course.description ?? null,
      thumbnail_url: course.thumbnail_url ?? null,
      category: course.category ?? null,
      difficulty_level: course.difficulty_level ?? null,
      course_type: course.course_type ?? null,
      price: course.price ?? 0,
      is_free: course.is_free ?? true,
      instructor_name: course.instructor_name ?? null,
      status: SessionStatus.DRAFT,
      rating: course.rating ?? 0,
      total_students: 0,
      total_lessons: course.total_lessons ?? 0,
      course_duration_hours: course.course_duration_hours ?? 0,
      total_sections: course.total_sections ?? 0,
      learning_objectives: course.learning_objectives ?? []
    };

    const duplicatedCourse = await this.createCourse(duplicatePayload);

    const sectionIdMap = new Map<number, number>();
    for (const section of sections) {
      const createdSection = await this.createCourseSection({
        course_id: duplicatedCourse.id,
        title: section.title,
        description: section.description ?? null,
        order_index: section.order_index
      });
      sectionIdMap.set(section.id, createdSection.id);
    }

    for (const lesson of (lessons as Session[] || [])) {
      const { id: _ignoreId, ...lessonPayload } = lesson;
      const duplicatedLesson: Partial<CreateSessionData> = {
        ...lessonPayload,
        course_id: duplicatedCourse.id,
        section_id: lesson.section_id ? sectionIdMap.get(lesson.section_id) ?? null : null
      };

      await this.supabase
        .from('sessions')
        .insert([duplicatedLesson]);
    }

    return duplicatedCourse;
  }

  async quickToggleCourseStatus(courseId: number): Promise<void> {
    const course = await this.getCourseDetails(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const nextStatus = course.status === SessionStatus.PUBLISHED
      ? SessionStatus.DRAFT
      : SessionStatus.PUBLISHED;

    const { error } = await this.supabase
      .from('courses')
      .update({ status: nextStatus })
      .eq('id', courseId);

    if (error) {
      console.error('Error toggling course status:', error);
      throw error;
    }
  }

  // ================= Course Sections =================

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

    return (data as CourseSection[]) || [];
  }

  async createCourseSection(sectionData: Partial<CourseSection>): Promise<CourseSection> {
    const { data, error } = await this.supabase
      .from('course_sections')
      .insert([sectionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating course section:', error);
      throw error;
    }

    return data as CourseSection;
  }

  async updateCourseSection(sectionId: number, sectionData: Partial<CourseSection>): Promise<CourseSection> {
    const { data, error } = await this.supabase
      .from('course_sections')
      .update(sectionData)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating course section:', error);
      throw error;
    }

    return data as CourseSection;
  }

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

  async reorderCourseSection(sectionId: number, orderIndex: number): Promise<void> {
    const { error } = await this.supabase
      .from('course_sections')
      .update({ order_index: orderIndex })
      .eq('id', sectionId);

    if (error) {
      console.error('Error reordering course section:', error);
      throw error;
    }
  }

  async getCourseCurriculum(courseId: number): Promise<{
    course: Course | null;
    sections: CourseSection[];
    lessons: Session[];
  }> {
    const [course, sections, lessonsResponse] = await Promise.all([
      this.getCourseDetails(courseId),
      this.getCourseSections(courseId),
      this.supabase
        .from('sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('section_id', { ascending: true })
        .order('order_index', { ascending: true })
    ]);

    if (lessonsResponse.error) {
      console.error('Error fetching course curriculum lessons:', lessonsResponse.error);
      throw lessonsResponse.error;
    }

    return {
      course,
      sections,
      lessons: (lessonsResponse.data as Session[]) || []
    };
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
