import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { AdminStats } from '../../core/models/session.model';

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-statistics.html'
})
export class AdminStatistics implements OnInit {
  private supabaseService = inject(SupabaseService);

  stats: AdminStats = {
    totalSessions: 0,
    totalSubmissions: 0,
    pendingReviews: 0
  };
  isLoading = true;

  async ngOnInit() {
    try {
      this.stats = await this.supabaseService.getAdminDashboardStats();
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
