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
}