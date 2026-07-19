import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Submission } from '../../core/models/session.model';
import { SubmissionStatus, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../core/constants/app.constants';

@Component({
  selector: 'app-admin-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-submissions.html'
})
export class AdminSubmissions implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  submissions: Submission[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  readonly SubmissionStatus = SubmissionStatus;

  async ngOnInit(): Promise<void> {
    await this.loadSubmissions();
  }

  async loadSubmissions(): Promise<void> {
    this.isLoading = true;
    this.clearMessages();

    try {
      this.submissions = await this.supabaseService.getAllSubmissions();
    } catch (error) {
      console.error('Error loading submissions:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    } finally {
      this.isLoading = false;
    }
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

