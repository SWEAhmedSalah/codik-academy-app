import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStatistics } from '../admin-statistics/admin-statistics';
import { AdminSessions } from '../admin-sessions/admin-sessions';
import { AdminSubmissions } from '../admin-submissions/admin-submissions';
import { SupabaseService } from '../../core/services/supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, AdminStatistics, AdminSessions, AdminSubmissions],
  templateUrl: './admin-layout.html'
})
export class AdminLayout {
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  activeTab: 'dashboard' | 'sessions' | 'submissions' = 'dashboard';

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/login']);
  }
}
