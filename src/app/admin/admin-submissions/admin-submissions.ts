import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Submission } from '../../core/models/session.model';
import { SubmissionStatus } from '../../core/constants/app.constants';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-admin-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-submissions.html'
})
export class AdminSubmissions implements OnInit, OnDestroy {
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  submissions: Submission[] = [];
  filteredSubmissions: Submission[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  isAutoRefreshing = false;

  // Filter properties
  searchText = '';
  selectedStatus: string = 'all';
  selectedSession: number | null = null;

  // Realtime subscription
  private submissionsChannel: RealtimeChannel | null = null;

  readonly SubmissionStatus = SubmissionStatus;

  get uniqueSessions(): { order_index: number; title: string }[] {
    const sessionsMap = new Map<number, { order_index: number; title: string }>();
    this.submissions.forEach(sub => {
      if (sub.sessions && !sessionsMap.has(sub.sessions.order_index)) {
        sessionsMap.set(sub.sessions.order_index, {
          order_index: sub.sessions.order_index,
          title: sub.sessions.title
        });
      }
    });
    return Array.from(sessionsMap.values()).sort((a, b) => a.order_index - b.order_index);
  }

  async ngOnInit(): Promise<void> {
    await this.loadSubmissions();
    this.setupRealtimeSubscription();
  }

  ngOnDestroy(): void {
    // Cleanup realtime subscription
    if (this.submissionsChannel) {
      this.supabaseService.getClient().removeChannel(this.submissionsChannel);
    }
  }

  private setupRealtimeSubscription(): void {
    console.log('Setting up Realtime subscription for submissions...');

    // Subscribe to changes in submissions table
    this.submissionsChannel = this.supabaseService
      .getClient()
      .channel('admin-submissions-changes', {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'submissions'
        },
        async (payload) => {
          console.log('🔔 Submission change detected!');
          console.log('Event type:', payload.eventType);
          console.log('Payload:', payload);

          // Show auto-refresh indicator
          this.isAutoRefreshing = true;

          // Reload submissions without showing main loader
          await this.loadSubmissions(false);

          // Hide auto-refresh indicator after 1 second
          setTimeout(() => {
            this.isAutoRefreshing = false;
          }, 1000);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to submissions changes');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error:', err);
        }
        if (status === 'TIMED_OUT') {
          console.error('⏱️ Subscription timed out');
        }
        if (status === 'CLOSED') {
          console.log('🔒 Channel closed');
        }
      });
  }

  async loadSubmissions(showLoader: boolean = true): Promise<void> {
    if (showLoader) {
      this.isLoading = true;
    }
    this.clearMessages();

    try {
      this.submissions = await this.supabaseService.getAllSubmissions();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading submissions:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    } finally {
      if (showLoader) {
        this.isLoading = false;
      }
    }
  }

  applyFilters(): void {
    this.filteredSubmissions = this.submissions.filter(submission => {
      // Filter by search text (student name)
      const matchesSearch = !this.searchText ||
        submission.student_name.toLowerCase().includes(this.searchText.toLowerCase());

      // Filter by status
      const matchesStatus = this.selectedStatus === 'all' ||
        submission.status === this.selectedStatus;

      // Filter by session
      const matchesSession = this.selectedSession === null ||
        submission.sessions?.order_index === this.selectedSession;

      return matchesSearch && matchesStatus && matchesSession;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onSessionChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'all';
    this.selectedSession = null;
    this.applyFilters();
  }

  async manualRefresh(): Promise<void> {
    await this.loadSubmissions(true);
  }

  async changeStatus(id: number, status: SubmissionStatus, feedback?: string): Promise<void> {
    try {
      this.isLoading = true;
      this.clearMessages();

      await this.supabaseService.updateSubmission(id, status, feedback || '');

      // Reload from database to confirm the update persisted
      await this.loadSubmissions();

      this.successMessage = this.t.t('success.statusUpdated');
    } catch (error) {
      console.error('Error updating submission status:', error);
      this.errorMessage = this.t.t('error.submissionFailed');
    } finally {
      this.isLoading = false;
    }
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}

