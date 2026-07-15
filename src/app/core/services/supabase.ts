import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {


  private supabase: SupabaseClient;

  constructor() {
    // تهيئة الاتصال بقاعدة البيانات
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // دالة أولية لجلب المحاضرات وترتيبها حسب التسلسل
  async getSessions() {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
    return data;
  }

  // إضافة محاضرة جديدة
  async addSession(sessionData: any) {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert([sessionData])
      .select(); // select عشان نرجع بيانات المحاضرة بعد ما تتضاف (نحتاج الـ ID بتاعها)

    if (error) throw error;
    return data;
  }

  async updateSession(id: number, sessionData: any) {
    const { data, error } = await this.supabase
      .from('sessions')
      .update(sessionData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  }

  // حذف محاضرة
  async deleteSession(id: number) {
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // إضافة روابط للمحاضرة (Materials)
  async addMaterial(materialData: any) {
    const { data, error } = await this.supabase
      .from('materials')
      .insert([materialData]);

    if (error) throw error;
    return data;
  }


  // جلب المحاضرات المنشورة فقط (لواجهة الطالب)
  async getPublishedSessions() {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('status', 'Published') // فلترة المنشور فقط
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  }

  // إرسال حل التكليف (PR)
  async submitAssignment(submissionData: { session_id: number, pr_link: string, student_name?: string }) {
    const { data, error } = await this.supabase
      .from('submissions') // تأكد من اسم الجدول
      .insert([submissionData]) // تأكد أن المفاتيح تطابق أسماء الأعمدة في الجدول (session_id, pr_link, student_name)
      .select();

    if (error) throw error;
    return data;
  }

  // جلب كل التكليفات المسلمة للآدمن (مع اسم المحاضرة المرتبطة)
  async getAllSubmissions() {
    const { data, error } = await this.supabase
      .from('submissions')
      .select(`
        *,
        sessions ( title, order_index )
      `)
      .order('submitted_at', { ascending: false }); // ترتيب من الأحدث للأقدم

    if (error) throw error;
    return data;
  }

  // تحديث حالة التكليف (مقبول / يحتاج تعديل)
  async updateSubmissionStatus(id: number, status: string) {
    const { data, error } = await this.supabase
      .from('submissions')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    return data;
  }

  // جلب إحصائيات لوحة التحكم للآدمن
  async getAdminDashboardStats() {
    // 1. إجمالي عدد المحاضرات
    const { count: sessionsCount, error: err1 } = await this.supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });

    // 2. إجمالي عدد التسليمات
    const { count: submissionsCount, error: err2 } = await this.supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    // 3. التسليمات التي تنتظر المراجعة (Pending)
    const { count: pendingCount, error: err3 } = await this.supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    if (err1 || err2 || err3) throw new Error('Error fetching stats');

    return {
      totalSessions: sessionsCount || 0,
      totalSubmissions: submissionsCount || 0,
      pendingReviews: pendingCount || 0
    };
  }

  // ================= Auth Methods =================

  // تسجيل الدخول
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  // تسجيل الخروج
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  // معرفة المستخدم الحالي (عشان لو عمل Refresh ميفقدش الدخول)
  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  // دالة لمعرفة صلاحية المستخدم
  async getUserRole(email: string) {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('email', email)
      .single();

    // لو ملقاش الإيميل في الجدول، بيعتبره طالب كوضع افتراضي
    if (error || !data) return 'student';
    return data.role;
  }

  // تحديث حالة التكليف وإضافة تعليق (feedback)
  // عدل التعريف ده في الـ Service
  async updateSubmission(id: string, status: 'Accepted' | 'Needs Rework', feedback: string) {
    const { error } = await this.supabase
      .from('submissions')
      .update({ status, feedback })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * جلب التكليفات التي قام الطالب بتسليمها فقط
   */
  async getStudentSubmissions(studentId: string) {
    const { data, error } = await this.supabase
      .from('submissions')
      .select('*, sessions(title, order_index)') // بنجيب بيانات المحاضرة المرتبطة بالمرة
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching student submissions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * تسليم تكليف جديد في قاعدة البيانات
   */
  async submitTask(taskData: {
    session_id: number;
    student_id: string;
    student_name: string;
    pr_link: string;
    status: 'Pending' | 'Accepted' | 'Needs Rework';
  }) {
    const { data, error } = await this.supabase
      .from('submissions')
      .insert([
        {
          session_id: taskData.session_id,
          student_id: taskData.student_id,
          student_name: taskData.student_name,
          pr_link: taskData.pr_link,
          status: taskData.status || 'Pending'
        }
      ])
      .select()
      .single(); // بنرجع الريكورد اللي اتعمله insert

    if (error) {
      console.error('Error submitting task:', error);
      throw error;
    }

    return data;
  }

}
