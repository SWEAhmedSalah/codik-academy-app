import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Session, Submission } from '../../core/models/session.model';
import { SubmissionStatus, ERROR_MESSAGES } from '../../core/constants/app.constants';

interface Announcement {
  title: string;
  date: string;
  message: string;
  icon: string;
}

interface CurrentSessionCard {
  number: number;
  title: string;
  recordedDate: string;
  duration: string;
}

interface LatestAssignmentCard {
  sessionId: number;
  title: string;
  description: string;
  dueDate: string;
  daysLeft: number;
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
  prLinks: Record<number, string> = {};

  // Dynamic cards
  currentSession: CurrentSessionCard | null = null;
  latestAssignment: LatestAssignmentCard | null = null;

  // Static announcements (will be translated in template)
  readonly recentAnnouncements: Announcement[] = [
    {
      title: 'تغيير موعد الجلسة',
      date: '2 يوليو 2026',
      message: 'ابتداءً من الأسبوع القادم، ستبدأ جميع الجلسات في الساعة 8:00 مساءً بدلاً من 7:00.',
      icon: 'megaphone'
    },
    {
      title: 'تكليف جديد',
      date: '1 يوليو 2026',
      message: 'المهمة 6 متاحة الآن. تحقق منها وحظاً سعيداً!',
      icon: 'clipboard'
    }
  ];

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

      this.sessions = await this.supabaseService.getSessions();
      this.mySubmissions = await this.supabaseService.getStudentSubmissions(user.id);

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
    this.totalAssignments = this.sessions.length;
    this.assignmentsCompleted = this.mySubmissions.length;
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
        duration: targetSession.duration || 'N/A'
      };

      this.latestAssignment = {
        sessionId: targetSession.id,
        title: `${this.t.t('dashboard.session')} ${targetSession.order_index}: ${targetSession.title}`,
        description: targetSession.description || this.t.t('session.assignment'),
        dueDate: targetSession.assignment_due_date || this.t.t('dashboard.due'),
        daysLeft: 0
      };
    } else {
      this.currentSession = null;
      this.latestAssignment = null;
    }
  }

  getSubmissionForSession(sessionId: number): Submission | undefined {
    return this.mySubmissions.find(submission => submission.session_id === sessionId);
  }

  async submitAssignment(sessionId: number): Promise<void> {
    const prLink = this.prLinks[sessionId]?.trim();
    if (!prLink) {
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';

      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.errorMessage = this.t.t('error.sessionExpired');
        return;
      }

      await this.supabaseService.submitTask({
        session_id: sessionId,
        student_id: user.id,
        student_name: this.studentName,
        pr_link: prLink,
        status: SubmissionStatus.PENDING
      });

      // Clear the input
      delete this.prLinks[sessionId];

      // Reload dashboard data
      await this.loadDashboardData();
    } catch (error) {
      console.error('Error submitting task:', error);
      this.errorMessage = this.t.t('error.submissionFailed');
    } finally {
      this.isLoading = false;
    }
  }
}
