import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStatistics } from '../admin-statistics/admin-statistics';
import { AdminSessions } from '../admin-sessions/admin-sessions';
import { AdminSubmissions } from '../admin-submissions/admin-submissions';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, AdminStatistics, AdminSessions, AdminSubmissions],
  templateUrl: './admin-layout.html'
})
export class AdminLayout {
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  activeTab: 'dashboard' | 'sessions' | 'submissions' = 'dashboard';

  async logout(): Promise<void> {
    await this.supabaseService.signOut();
    this.router.navigate(['/login']);
  }
}
