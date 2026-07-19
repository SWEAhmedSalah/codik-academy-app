import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { StudentStateService } from '../../core/services/student-state';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { APP_CONSTANTS, SubmissionStatus } from '../../core/constants/app.constants';
import { Submission } from '../../core/models/session.model';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './session-details.html'
})
export class SessionDetails implements OnInit, OnDestroy {
  readonly stateService = inject(StudentStateService);
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  selectedSession = this.stateService.selectedSession;

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';
  existingSubmission: Submission | null = null;
  isLoadingSubmission = true;

  // Countdown timer properties
  timeRemaining: TimeRemaining | null = null;
  private countdownInterval: any = null;

  repoUrlControl = new FormControl('');
  prLinkControl = new FormControl('', [
    Validators.required,
    Validators.pattern(APP_CONSTANTS.VALIDATION.GITHUB_URL_PATTERN)
  ]);

  constructor() {
  }

  ngOnInit(): void {
    this.loadExistingSubmission();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  async loadExistingSubmission(): Promise<void> {
    try {
      this.isLoadingSubmission = true;
      const user = await this.supabaseService.getCurrentUser();
      const session = this.stateService.selectedSession();
      if (user && session) {
        const studentName = user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'Student';
        const submissions = await this.supabaseService.getStudentSubmissions(studentName);
        this.existingSubmission = submissions.find(s => s.session_id === session.id) || null;
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    } finally {
      this.isLoadingSubmission = false;
    }
  }

  goBackToCourse(): void {
    this.stateService.navigateTo('course');
  }

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

      // If resubmitting after rejection, update existing submission
      if (this.existingSubmission && this.existingSubmission.status === SubmissionStatus.NEEDS_REWORK) {
        await this.supabaseService.resubmitTask(
          this.existingSubmission.id,
          cleanLink!,
          currentSession.id,
          studentName
        );
      } else {
        await this.supabaseService.submitTask({
          session_id: currentSession.id,
          pr_link: cleanLink!,
          student_name: studentName,
          status: SubmissionStatus.PENDING
        });
      }

      this.submitSuccess = true;
      this.prLinkControl.reset();
      this.repoUrlControl.reset();

      // Reload submission to show status
      await this.loadExistingSubmission();

    } catch (error) {
      console.error('Error submitting PR:', error);
      this.submitError = this.t.t('error.submissionFailed');
    } finally {
      this.isSubmitting = false;
    }
  }

  private startCountdown(): void {
    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private updateCountdown(): void {
    const session = this.stateService.selectedSession();
    const dueDate = session?.assignment_due_date;

    if (!dueDate) {
      this.timeRemaining = null;
      return;
    }

    const now = new Date().getTime();
    const due = new Date(dueDate).getTime();
    const difference = due - now;

    if (difference <= 0) {
      this.timeRemaining = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true
      };
      this.stopCountdown();
      return;
    }

    this.timeRemaining = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      isExpired: false
    };
  }
}
