import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environment/environment';
import {
  Session,
  Submission,
  Attendance,
  Course,
  CourseSection,
  AdminStats,
  CreateSessionData,
  CreateSubmissionData,
  BugReportData
} from '../models/session.model';
import { UserRole, SubmissionStatus, SessionStatus, AttendanceStatus } from '../constants/app.constants';

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

  /**
   * Get the full list of registered students for the attendance roster,
   * taken directly from the `user_roles` table (every account whose role
   * isn't 'admin'), exactly as stored - no name splitting or merging.
   */
  async getStudentRoster(): Promise<string[]> {
    const { data: roleRows, error: roleError } = await this.supabase
      .from('user_roles')
      .select('email, role');

    if (roleError) {
      console.error('Error fetching students from user_roles:', roleError);
      throw roleError;
    }

    return (roleRows || [])
      .filter(row => (row.role || '').toLowerCase() !== 'admin')
      .map(row => row.email)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  /**
   * Get every attendance record across all sessions in one call, used to
   * build the full spreadsheet-style attendance grid (students x sessions).
   */
  async getAllAttendance(): Promise<Attendance[]> {
    const { data, error } = await this.supabase
      .from('attendance')
      .select('*');

    if (error) {
      console.error('Error fetching all attendance:', error);
      throw error;
    }
    return (data as Attendance[]) || [];
  }

  /**
   * Get attendance records for a specific session (for admin marking view)
   */
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

  /**
   * Mark (create or update) a student's attendance status for a session.
   * Uses RPC function to bypass RLS restrictions, same pattern as submissions.
   */
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

  /**
   * Get all attendance records for a specific student (for dashboard/profile/progress).
   * Admin marks attendance using the student's exact `user_roles.email` value, while the
   * logged-in student's display name may be their `full_name` or the email prefix - so we
   * match against every identifier that could plausibly have been used to save the record.
   */
  async getStudentAttendance(...identifiers: string[]): Promise<Attendance[]> {
    const names = Array.from(new Set(identifiers.filter(Boolean)));
    if (names.length === 0) return [];

    const { data, error } = await this.supabase
      .from('attendance')
      .select('*, sessions(title, order_index)')
      .in('student_name', names);

    if (error) {
      console.error('Error fetching student attendance:', error);
      throw error;
    }
    return (data as Attendance[]) || [];
  }

  // ================= Course Management =================

  /**
   * Get all courses for admin management
   */
  async getAllCourses(): Promise<Course[]> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 9999);

    if (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
    return (data as Course[]) || [];
  }

  /**
   * Get a single course by ID
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
   * Create a new course
   */
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

  /**
   * Update an existing course
   */
  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .update(courseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      throw error;
    }
    return data as Course;
  }

  /**
   * Delete a course by ID
   */
  async deleteCourse(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('courses')
      .delete()
      .eq('id', id);

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
      throw new Error(`Course ${courseId} not found`);
    }

    const [sections, lessons] = await Promise.all([
      this.getCourseSections(courseId),
      this.supabase
        .from('sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .range(0, 9999)
    ]);

    if (lessons.error) {
      console.error('Error fetching lessons for duplication:', lessons.error);
      throw lessons.error;
    }

    const slugSuffix = Date.now();
    const duplicatePayload: Partial<Course> = {
      title: `${originalCourse.title} (Copy)`,
      slug: originalCourse.slug ? `${originalCourse.slug}-copy-${slugSuffix}` : null,
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
      total_students: 0,
      total_lessons: originalCourse.total_lessons ?? 0,
      total_sections: originalCourse.total_sections ?? 0,
      course_duration_hours: originalCourse.course_duration_hours ?? 0,
      learning_objectives: originalCourse.learning_objectives ?? []
    };

    const duplicatedCourse = await this.createCourse(duplicatePayload);

    const sectionIdMap = new Map<number, number>();

    if (sections.length > 0) {
      const sectionPayload = sections.map((section: CourseSection) => ({
        course_id: duplicatedCourse.id,
        title: section.title,
        description: section.description ?? null,
        order_index: section.order_index,
        total_lessons: section.total_lessons ?? 0
      }));

      const { data: duplicatedSections, error: sectionsError } = await this.supabase
        .from('course_sections')
        .insert(sectionPayload)
        .select();

      if (sectionsError) {
        console.error('Error duplicating course sections:', sectionsError);
        throw sectionsError;
      }

      (duplicatedSections as CourseSection[]).forEach((section: CourseSection, index: number) => {
        sectionIdMap.set(sections[index].id, section.id);
      });
    }

    const originalLessons = (lessons.data as Session[]) || [];
    if (originalLessons.length > 0) {
      const lessonPayload = originalLessons.map((lesson: Session) => ({
        title: lesson.title,
        description: lesson.description ?? null,
        order_index: lesson.order_index,
        status: lesson.status,
        student_status: lesson.student_status ?? null,
        recorded_date: lesson.recorded_date ?? null,
        duration: lesson.duration ?? null,
        recording_link: lesson.recording_link ?? null,
        slide_link: lesson.slide_link ?? null,
        assets_link: lesson.assets_link ?? null,
        assignment_title: lesson.assignment_title ?? null,
        assignment_description: lesson.assignment_description ?? null,
        assignment_due_date: lesson.assignment_due_date ?? null,
        is_locked: lesson.is_locked ?? false,
        course_id: duplicatedCourse.id,
        section_id: lesson.section_id ? sectionIdMap.get(lesson.section_id) ?? null : null,
        is_preview: lesson.is_preview ?? false,
        content_type: lesson.content_type ?? 'video'
      }));

      const { error: lessonsInsertError } = await this.supabase
        .from('sessions')
        .insert(lessonPayload);

      if (lessonsInsertError) {
        console.error('Error duplicating course lessons:', lessonsInsertError);
        throw lessonsInsertError;
      }
    }

    return duplicatedCourse;
  }

  /**
   * Toggle course status between Draft and Published
   */
  async quickToggleCourseStatus(courseId: number): Promise<Course> {
    const course = await this.getCourseDetails(courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    const nextStatus: Course['status'] = course.status === 'Published' ? 'Draft' : 'Published';
    return this.updateCourse(courseId, { status: nextStatus });
  }

  /**
   * Get all sections belonging to a course
   */
  async getCourseSections(courseId: number): Promise<CourseSection[]> {
    const { data, error } = await this.supabase
      .from('course_sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })
      .range(0, 9999);

    if (error) {
      console.error('Error fetching course sections:', error);
      throw error;
    }
    return (data as CourseSection[]) || [];
  }

  /**
   * Create a new course section
   */
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

  /**
   * Update an existing course section
   */
  async updateCourseSection(id: number, sectionData: Partial<CourseSection>): Promise<CourseSection> {
    const { data, error } = await this.supabase
      .from('course_sections')
      .update(sectionData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating course section:', error);
      throw error;
    }
    return data as CourseSection;
  }

  /**
   * Delete a course section by ID
   */
  async deleteCourseSection(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('course_sections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course section:', error);
      throw error;
    }
  }

  /**
   * Update section order index
   */
  async reorderCourseSection(id: number, newOrderIndex: number): Promise<CourseSection> {
    const { data, error } = await this.supabase
      .from('course_sections')
      .update({ order_index: newOrderIndex })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error reordering course section:', error);
      throw error;
    }
    return data as CourseSection;
  }

  /**
   * Get lessons belonging to a specific section
   */
  async getSessionsBySection(sectionId: number): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: true })
      .range(0, 9999);

    if (error) {
      console.error('Error fetching sessions by section:', error);
      throw error;
    }
    return (data as Session[]) || [];
  }

  /**
   * Get course curriculum (course, sections, and nested lessons)
   */
  async getCourseCurriculum(courseId: number): Promise<{
    course: Course | null;
    sections: CourseSection[];
    lessons: Session[];
  }> {
    const [course, sections, lessons] = await Promise.all([
      this.getCourseDetails(courseId),
      this.getCourseSections(courseId),
      this.supabase
        .from('sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('section_id', { ascending: true })
        .order('order_index', { ascending: true })
        .range(0, 9999)
    ]);

    if (lessons.error) {
      console.error('Error fetching course curriculum lessons:', lessons.error);
      throw lessons.error;
    }

    return {
      course,
      sections,
      lessons: (lessons.data as Session[]) || []
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
