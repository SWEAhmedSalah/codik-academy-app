import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { StudentStateService } from '../../core/services/student-state';
import { Session, Submission } from '../../core/models/session.model';
import { SubmissionStatus, StudentSessionStatus, ERROR_MESSAGES } from '../../core/constants/app.constants';

interface CurrentSessionCard {
  number: number;
  title: string;
  recordedDate: string;
  duration: string;
  session: Session;
}

interface CurrentAssignmentCard {
  sessionId: number;
  title: string;
  shortDescription: string;
  dueDate: string;
  submitted: boolean;
  submission?: Submission;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);
  readonly stateService = inject(StudentStateService);

  isLoading = true;
  errorMessage = '';

  // Dashboard metrics
  studentName = '';
  courseProgress = 0;
  sessionsAttended = 0;
  totalSessions = 0;
  assignmentsCompleted = 0;
  totalAssignments = 0;

  // Data from database
  sessions: Session[] = [];
  mySubmissions: Submission[] = [];

  // Dynamic cards
  currentSession: CurrentSessionCard | null = null;
  currentAssignment: CurrentAssignmentCard | null = null;
  upcomingSession: Session | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.errorMessage = this.t.t('error.sessionExpired');
        return;
      }

      this.studentName = user.user_metadata?.['full_name'] ||
                         user.email?.split('@')[0] ||
                         'Student';

      this.sessions = await this.supabaseService.getPublishedSessions();
      this.mySubmissions = await this.supabaseService.getStudentSubmissions(this.studentName);

      this.calculateMetrics();
      this.setCurrentSessionAndAssignment();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    } finally {
      this.isLoading = false;
    }
  }

  private calculateMetrics(): void {
    this.totalSessions = this.sessions.length;
    this.totalAssignments = this.sessions.filter(s => !!s.assignment_title).length;
    this.assignmentsCompleted = this.mySubmissions.filter(
      sub => sub.status === SubmissionStatus.ACCEPTED
    ).length;
    this.sessionsAttended = this.mySubmissions.length;

    if (this.totalAssignments > 0) {
      this.courseProgress = Math.round((this.assignmentsCompleted / this.totalAssignments) * 100);
    }
  }

  private setCurrentSessionAndAssignment(): void {
    const unsubmittedSessions = this.sessions.filter(session =>
      !this.mySubmissions.find(submission => submission.session_id === session.id)
    );

    if (unsubmittedSessions.length > 0) {
      const targetSession = unsubmittedSessions[0];

      this.currentSession = {
        number: targetSession.order_index,
        title: targetSession.title,
        recordedDate: targetSession.recorded_date || 'N/A',
        duration: targetSession.duration || 'N/A',
        session: targetSession
      };

      // Only show current assignment if the session actually has one
      if (targetSession.assignment_title) {
        this.currentAssignment = {
          sessionId: targetSession.id,
          title: `${this.t.t('dashboard.session')} ${targetSession.order_index}: ${targetSession.title}`,
          shortDescription: targetSession.assignment_description || targetSession.description || this.t.t('session.assignment'),
          dueDate: targetSession.assignment_due_date || this.t.t('dashboard.due'),
          submitted: false
        };
      } else {
        this.currentAssignment = null;
      }

      // Find upcoming session: must have 'Upcoming' status AND no recorded_date (or future date)
      const upcoming = this.sessions.find(
        s => s.student_status === StudentSessionStatus.UPCOMING && !s.recorded_date
      ) || this.sessions.find(
        s => s.student_status === StudentSessionStatus.UPCOMING &&
             s.recorded_date && new Date(s.recorded_date) > new Date()
      );
      if (upcoming) {
        this.upcomingSession = upcoming;
      } else {
        this.upcomingSession = null;
      }
    } else {
      this.currentSession = null;
      this.currentAssignment = null;

      // Find upcoming session even when all are submitted
      const upcoming = this.sessions.find(
        s => s.student_status === StudentSessionStatus.UPCOMING && !s.recorded_date
      ) || this.sessions.find(
        s => s.student_status === StudentSessionStatus.UPCOMING &&
             s.recorded_date && new Date(s.recorded_date) > new Date()
      );
      this.upcomingSession = upcoming || null;

      // If all submitted, show last session as current
      if (this.sessions.length > 0) {
        const lastSession = this.sessions[this.sessions.length - 1];
        const lastSubmission = this.mySubmissions.find(s => s.session_id === lastSession.id);

        if (lastSession.assignment_title) {
          this.currentAssignment = {
            sessionId: lastSession.id,
            title: `${this.t.t('dashboard.session')} ${lastSession.order_index}: ${lastSession.title}`,
            shortDescription: lastSession.assignment_description || lastSession.description || '',
            dueDate: lastSession.assignment_due_date || '',
            submitted: true,
            submission: lastSubmission
          };
        }
      }
    }
  }

  getSubmissionForSession(sessionId: number): Submission | undefined {
    return this.mySubmissions.find(submission => submission.session_id === sessionId);
  }

  openSession(session: Session): void {
    this.stateService.openSession(session);
  }

  goToCourse(): void {
    this.stateService.navigateTo('course');
  }

  /**
   * Get the session status from the database value
   */
  getSessionStatus(session: Session): string {
    return session.student_status || StudentSessionStatus.UPCOMING;
  }

  /**
   * Strip HTML tags and return plain text (truncated for dashboard summary)
   */
  private stripHtml(html: string): string {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }
}
