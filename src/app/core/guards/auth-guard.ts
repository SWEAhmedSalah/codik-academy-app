import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { APP_CONSTANTS, UserRole } from '../constants/app.constants';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  try {
    const user = await supabaseService.getCurrentUser();

    if (!user || !user.email) {
      router.navigate([APP_CONSTANTS.ROUTES.LOGIN]);
      return false;
    }

    const role = await supabaseService.getUserRole(user.email);
    const targetUrl = state.url;

    // Redirect admin users trying to access student routes
    if (targetUrl.includes('/student') && role === UserRole.ADMIN) {
      router.navigate([APP_CONSTANTS.ROUTES.ADMIN]);
      return false;
    }

    // Redirect student users trying to access admin routes
    if (targetUrl.includes('/admin') && role === UserRole.STUDENT) {
      router.navigate([APP_CONSTANTS.ROUTES.STUDENT]);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Auth Guard Error:', error);
    router.navigate([APP_CONSTANTS.ROUTES.LOGIN]);
    return false;
  }
};
