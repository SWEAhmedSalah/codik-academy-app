import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // 1. نجيب المستخدم الحالي
  const user = await supabaseService.getCurrentUser();

  if (!user || !user.email) {
    router.navigate(['/login']);
    return false;
  }

  // 2. نجيب الصلاحية بتاعته من الداتابيز
  const role = await supabaseService.getUserRole(user.email);
  const isAdmin = role === 'admin';
  const targetUrl = state.url;

  // 3. نطبق القواعد
  if (targetUrl.includes('/admin') && !isAdmin) {
    router.navigate(['/student']);
    return false;
  }

  if (targetUrl.includes('/student') && isAdmin) {
    router.navigate(['/admin']);
    return false;
  }

  return true;
};