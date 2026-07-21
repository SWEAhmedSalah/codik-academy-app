import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { AdminStats } from '../../core/models/session.model';
import { ERROR_MESSAGES } from '../../core/constants/app.constants';

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-statistics.html'
})
export class AdminStatistics implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  @Output() navigateTo = new EventEmitter<string>();

  stats: AdminStats = {
    totalSessions: 0,
    totalSubmissions: 0,
    pendingReviews: 0
  };
  isLoading = true;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    await this.loadStats();
  }

  async loadStats(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.stats = await this.supabaseService.getAdminDashboardStats();
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    } finally {
      this.isLoading = false;
    }
  }

  goToSessions(): void {
    this.navigateTo.emit('sessions');
  }

  goToSubmissions(): void {
    this.navigateTo.emit('submissions');
  }
}
