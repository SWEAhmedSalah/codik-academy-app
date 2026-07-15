import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';

export const adminGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  try {
    // 1. نجيب بيانات المستخدم
    const user = await supabaseService.getCurrentUser(); 
    
    // 2. لو مفيش مستخدم أو مفيش إيميل، ارميه على اللوجين
    if (!user || !user.email) {
      router.navigate(['/login']);
      return false;
    }

    // 3. نستخدم الميثود بتاعتك ونبعتلها الإيميل
    const role = await supabaseService.getUserRole(user.email);

    // 4. التوجيه بناءً على الصلاحية
    if (role === 'admin') {
      return true; // مسموح بالدخول
    } else {
      // لو student، امنعه من الدخول ووجهه لمكان تاني (مثلاً لوحة الطلبة)
      router.navigate(['/']); 
      return false;
    }
  } catch (error) {
    console.error('Admin Guard Error:', error);
    router.navigate(['/login']);
    return false;
  }
};