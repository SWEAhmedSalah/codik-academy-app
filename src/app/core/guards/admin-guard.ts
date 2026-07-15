import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { APP_CONSTANTS, UserRole } from '../constants/app.constants';

export const adminGuard: CanActivateFn = async (_route, _state) => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  try {
    const user = await supabaseService.getCurrentUser();

    if (!user || !user.email) {
      router.navigate([APP_CONSTANTS.ROUTES.LOGIN]);
      return false;
    }

    const role = await supabaseService.getUserRole(user.email);

    if (role === UserRole.ADMIN) {
      return true;
    }

    // Redirect non-admin users to student area
    router.navigate([APP_CONSTANTS.ROUTES.STUDENT]);
    return false;
  } catch (error) {
    console.error('Admin Guard Error:', error);
    router.navigate([APP_CONSTANTS.ROUTES.LOGIN]);
    return false;
  }
};
