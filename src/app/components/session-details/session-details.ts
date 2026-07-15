import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { StudentStateService } from '../../core/services/student-state';
import { SupabaseService } from '../../core/services/supabase';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './session-details.html'
})
export class SessionDetails {
  stateService = inject(StudentStateService);
  private supabaseService = inject(SupabaseService);

  // Make selectedSession available to template
  selectedSession = this.stateService.selectedSession;

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  // FormControl with GitHub URL validation
  prLinkControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^https:\/\/github\.com\/.+/)
  ]);

  async submitPR() {
    // Validate form
    if (this.prLinkControl.invalid) {
      this.prLinkControl.markAsTouched();
      return;
    }

    const cleanLink = this.prLinkControl.value?.trim();
    const currentSession = this.stateService.selectedSession();

    if (!currentSession?.id) {
      this.submitError = 'No session selected!';
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;

    try {
      // Get current authenticated user
      const user = await this.supabaseService.getCurrentUser();

      if (!user) {
        this.submitError = 'You must be logged in to submit.';
        return;
      }

      // Extract student name from user metadata or email
      const studentName = user.user_metadata?.['full_name'] ||
                         user.email?.split('@')[0] ||
                         'Student';

      // Submit with actual user data
      await this.supabaseService.submitTask({
        session_id: currentSession.id,
        student_id: user.id,
        pr_link: cleanLink!,
        student_name: studentName,
        status: 'Pending'
      });

      this.submitSuccess = true;
      this.prLinkControl.reset();

    } catch (error) {
      console.error('Error submitting PR:', error);
      this.submitError = 'Failed to submit. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
