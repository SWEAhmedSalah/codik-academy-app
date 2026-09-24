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
  CourseSection,
  CourseWithProgress,
  CourseFilters,
  UserCourseProgress
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

    const { count: coursesCount, error: err4 } = await this.supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    const { count: publishedCount, error: err5 } = await this.supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Published');

    const { count: draftCount, error: err6 } = await this.supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Draft');

    const { count: enrollmentsCount, error: err7 } = await this.supabase
      .from('user_course_enrollments')
      .select('*', { count: 'exact', head: true });

    if (err1 || err2 || err3 || err4 || err5 || err6 || err7) {
      console.error('Error fetching stats:', err1 || err2 || err3 || err4 || err5 || err6 || err7);
      throw new Error('Error fetching stats');
    }

    return {
      totalSessions: sessionsCount || 0,
      totalSubmissions: submissionsCount || 0,
      pendingReviews: pendingCount || 0,
      totalCourses: coursesCount || 0,
      publishedCourses: publishedCount || 0,
      draftCourses: draftCount || 0,
      totalEnrollments: enrollmentsCount || 0,
      totalSections: 0  // This will be populated in getExtendedAdminStats if needed
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

  // ================= Course Management (Admin) =================

  /**
   * Get all courses (admin view - includes drafts)
   */
  async getAllCourses(): Promise<Course[]> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all courses:', error);
      throw error;
    }
    return data as Course[] || [];
  }

  /**
   * Create a new course
   */
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .insert([{
        ...courseData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
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
   * Delete a course by ID
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

  // ================= Course Catalog =================

  /**
   * Get all published courses with optional filters
   */
  async getPublicCourses(filters?: CourseFilters): Promise<Course[]> {
    let query = this.supabase
      .from('courses')
      .select('*')
      .eq('status', 'Published');

    // Apply filters
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      query = query.eq('difficulty_level', filters.difficulty);
    }
    if (filters?.priceType === 'free') {
      query = query.eq('is_free', true);
    } else if (filters?.priceType === 'paid') {
      query = query.eq('is_free', false);
    }
    if (filters?.courseType && filters.courseType !== 'all') {
      query = query.eq('course_type', filters.courseType);
    }

    // Apply sorting
    switch (filters?.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('total_students', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching public courses:', error);
      throw error;
    }
    return data as Course[] || [];
  }

  /**
   * Get single course details
   */
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

  /**
   * Get course lessons/sessions
   */
  async getCourseLessons(courseId: number): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('course_id', courseId)
      .eq('status', SessionStatus.PUBLISHED)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching course lessons:', error);
      throw error;
    }
    return data as Session[] || [];
  }

  /**
   * Check if user is enrolled in course
   */
  async isUserEnrolled(userId: string, courseId: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
    return !!data;
  }

  /**
   * Get user progress for a course
   */
  async getUserCourseProgress(userId: string, courseId: number): Promise<UserCourseProgress> {
    // Get total published lessons for course
    const { data: lessons } = await this.supabase
      .from('sessions')
      .select('id')
      .eq('course_id', courseId)
      .eq('status', SessionStatus.PUBLISHED);

    const totalLessons = lessons?.length || 0;

    // Get completed lessons
    const { data: progress } = await this.supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_completed', true);

    const completedLessons = progress?.length || 0;
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return { completedLessons, totalLessons, percentage };
  }

  /**
   * Enroll user in course (free courses only)
   */
  async enrollUserInCourse(userId: string, courseId: number): Promise<void> {
    // Check if course is free
    const { data: course } = await this.supabase
      .from('courses')
      .select('is_free')
      .eq('id', courseId)
      .single();

    if (!course?.is_free) {
      throw new Error('This course requires payment');
    }

    // Enroll user
    const { error } = await this.supabase
      .from('user_course_enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error enrolling user:', error);
      throw error;
    }
  }

  /**
   * Get enrolled courses for user with progress
   */
  async getEnrolledCoursesWithProgress(userId: string): Promise<CourseWithProgress[]> {
    const { data: enrollments, error } = await this.supabase
      .from('user_course_enrollments')
      .select(`
        course_id,
        enrolled_at,
        courses (*)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching enrolled courses:', error);
      throw error;
    }

    // Get progress for each course
    const coursesWithProgress = await Promise.all(
      (enrollments || []).map(async (enrollment: any) => {
        const progress = await this.getUserCourseProgress(userId, enrollment.course_id);
        return {
          ...enrollment.courses,
          enrollment_date: enrollment.enrolled_at,
          progress
        };
      })
    );

    return coursesWithProgress as CourseWithProgress[];
  }

  // ================= Course Sections Management =================

  /**
   * Get all sections for a course
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
    return data as CourseSection[] || [];
  }

  /**
   * Get single course section by ID
   */
  async getCourseSection(sectionId: number): Promise<CourseSection | null> {
    const { data, error } = await this.supabase
      .from('course_sections')
      .select('*')
      .eq('id', sectionId)
      .single();

    if (error) {
      console.error('Error fetching course section:', error);
      return null;
    }
    return data as CourseSection;
  }

  /**
   * Create a new course section
   */
  async createCourseSection(sectionData: {
    course_id: number;
    title: string;
    description?: string;
    order_index: number;
  }): Promise<CourseSection> {
    const { data, error } = await this.supabase
      .from('course_sections')
      .insert([{
        ...sectionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
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
  async updateCourseSection(sectionId: number, updates: Partial<CourseSection>): Promise<void> {
    const { error } = await this.supabase
      .from('course_sections')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', sectionId);

    if (error) {
      console.error('Error updating course section:', error);
      throw error;
    }
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
   * Reorder course section
   */
  async reorderCourseSection(sectionId: number, newOrderIndex: number): Promise<void> {
    const { error } = await this.supabase
      .from('course_sections')
      .update({ order_index: newOrderIndex, updated_at: new Date().toISOString() })
      .eq('id', sectionId);

    if (error) {
      console.error('Error reordering course section:', error);
      throw error;
    }
  }

  // ================= Enhanced Sessions Management =================

  /**
   * Get all sessions for a specific course
   */
  async getSessionsByCourse(courseId: number): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        course_sections(id, title)
      `)
      .eq('course_id', courseId)
      .order('section_id', { ascending: true, nullsFirst: true })
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching sessions by course:', error);
      throw error;
    }
    return data as Session[] || [];
  }

  /**
   * Get all sessions for a specific section
   */
  async getSessionsBySection(sectionId: number): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching sessions by section:', error);
      throw error;
    }
    return data as Session[] || [];
  }

  /**
   * Assign session to a section
   */
  async assignSessionToSection(sessionId: number, sectionId: number | null): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .update({ section_id: sectionId })
      .eq('id', sessionId);

    if (error) {
      console.error('Error assigning session to section:', error);
      throw error;
    }
  }

  /**
   * Bulk assign sessions to section
   */
  async bulkAssignSessionsToSection(sessionIds: number[], sectionId: number): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .update({ section_id: sectionId })
      .in('id', sessionIds);

    if (error) {
      console.error('Error bulk assigning sessions to section:', error);
      throw error;
    }
  }

  // ================= Curriculum Builder =================

  /**
   * Get complete curriculum for a course (course + sections + lessons)
   */
  async getCourseCurriculum(courseId: number): Promise<{
    course: Course;
    sections: CourseSection[];
    lessons: Session[];
  }> {
    // Get course
    const course = await this.getCourseDetails(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Get sections
    const sections = await this.getCourseSections(courseId);

    // Get lessons
    const lessons = await this.getSessionsByCourse(courseId);

    return {
      course,
      sections,
      lessons
    };
  }

  // ================= Enhanced Course Management =================

  /**
   * Duplicate a course with all sections and lessons
   */
  async duplicateCourse(courseId: number): Promise<Course> {
    // Get original course
    const original = await this.getCourseDetails(courseId);
    if (!original) {
      throw new Error('Course not found');
    }

    // Create duplicate course
    const duplicateData: Partial<Course> = {
      ...original,
      title: `${original.title} (Copy)`,
      slug: original.slug ? `${original.slug}-copy` : undefined,
      status: 'Draft',
      total_students: 0,
      total_lessons: 0,
      total_sections: 0
    };

    delete (duplicateData as any).id;
    delete (duplicateData as any).created_at;
    delete (duplicateData as any).updated_at;

    const newCourse = await this.createCourse(duplicateData);

    // Duplicate sections
    const sections = await this.getCourseSections(courseId);
    for (const section of sections) {
      const newSection = await this.createCourseSection({
        course_id: newCourse.id,
        title: section.title,
        description: section.description,
        order_index: section.order_index
      });

      // Duplicate lessons in section
      const lessons = await this.getSessionsBySection(section.id);
      for (const lesson of lessons) {
        const lessonData: any = { ...lesson };
        delete lessonData.id;
        delete lessonData.created_at;
        delete lessonData.updated_at;
        lessonData.course_id = newCourse.id;
        lessonData.section_id = newSection.id;
        await this.addSession(lessonData);
      }
    }

    return newCourse;
  }

  /**
   * Quick toggle course status (Published <-> Draft)
   */
  async quickToggleCourseStatus(courseId: number): Promise<void> {
    const course = await this.getCourseDetails(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const newStatus = course.status === 'Published' ? 'Draft' : 'Published';
    await this.updateCourse(courseId, { status: newStatus });
  }

  // ================= Enhanced Statistics =================

  /**
   * Get enhanced admin dashboard statistics
   */
  async getEnhancedAdminStats(): Promise<AdminStats> {
    // Get basic stats
    const basicStats = await this.getAdminDashboardStats();

    // Total sections
    const { count: sectionsCount } = await this.supabase
      .from('course_sections')
      .select('*', { count: 'exact', head: true });

    const totalSections = sectionsCount || 0;

    // Get all courses to calculate averages
    const { data: courses } = await this.supabase
      .from('courses')
      .select('id, title, total_lessons, total_students, total_sections');

    const avgLessons = courses && courses.length > 0
      ? courses.reduce((sum, c) => sum + (c.total_lessons || 0), 0) / courses.length
      : 0;

    const avgSections = courses && courses.length > 0
      ? totalSections / courses.length
      : 0;

    // Top courses by enrollment
    const topCourses = courses
      ? courses
          .sort((a, b) => (b.total_students || 0) - (a.total_students || 0))
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            title: c.title,
            total_students: c.total_students || 0
          }))
      : [];

    return {
      ...basicStats,
      totalSections,
      averageLessonsPerCourse: Math.round(avgLessons * 10) / 10,
      averageSectionsPerCourse: Math.round(avgSections * 10) / 10,
      topCoursesByEnrollment: topCourses
    };
  }

}
