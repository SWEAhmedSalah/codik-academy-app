import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-bug-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bug-report.html'
})
export class BugReport implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  isOpen = false;
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  bugTitle = '';
  bugDescription = '';
  bugCategory = 'ui';
  userEmail = '';
  userName = '';

  async ngOnInit(): Promise<void> {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user?.email) {
        this.userEmail = user.email;
        this.userName = user.user_metadata?.['full_name'] || user.email.split('@')[0] || '';
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  toggleModal(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.resetForm();
    }
  }

  async submitBug(): Promise<void> {
    if (!this.bugTitle.trim() || !this.bugDescription.trim()) {
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;

    try {
      await this.supabaseService.submitBugReport({
        title: this.bugTitle.trim(),
        description: this.bugDescription.trim(),
        category: this.bugCategory,
        reported_by: this.userName || this.userEmail,
        email: this.userEmail
      });

      this.submitSuccess = true;
      setTimeout(() => {
        this.isOpen = false;
        this.resetForm();
      }, 2000);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      this.submitError = this.t.t('bugReport.errorMessage');
    } finally {
      this.isSubmitting = false;
    }
  }

  private resetForm(): void {
    this.bugTitle = '';
    this.bugDescription = '';
    this.bugCategory = 'ui';
    this.submitSuccess = false;
    this.submitError = '';
  }
}

