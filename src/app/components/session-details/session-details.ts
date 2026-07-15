import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { StudentStateService } from '../../core/services/student-state';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { APP_CONSTANTS, SubmissionStatus, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../core/constants/app.constants';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './session-details.html'
})
export class SessionDetails {
  readonly stateService = inject(StudentStateService);
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  selectedSession = this.stateService.selectedSession;

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  prLinkControl = new FormControl('', [
    Validators.required,
    Validators.pattern(APP_CONSTANTS.VALIDATION.GITHUB_URL_PATTERN)
  ]);

  async submitPR(): Promise<void> {
    if (this.prLinkControl.invalid) {
      this.prLinkControl.markAsTouched();
      return;
    }

    const cleanLink = this.prLinkControl.value?.trim();
    const currentSession = this.stateService.selectedSession();

    if (!currentSession?.id) {
      this.submitError = this.t.t('error.sessionExpired');
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;

    try {
      const user = await this.supabaseService.getCurrentUser();

      if (!user) {
        this.submitError = this.t.t('error.sessionExpired');
        return;
      }

      const studentName = user.user_metadata?.['full_name'] ||
                         user.email?.split('@')[0] ||
                         'Student';

      await this.supabaseService.submitTask({
        session_id: currentSession.id,
        student_id: user.id,
        pr_link: cleanLink!,
        student_name: studentName,
        status: SubmissionStatus.PENDING
      });

      this.submitSuccess = true;
      this.prLinkControl.reset();

    } catch (error) {
      console.error('Error submitting PR:', error);
      this.submitError = this.t.t('error.submissionFailed');
    } finally {
      this.isSubmitting = false;
    }
  }
}
