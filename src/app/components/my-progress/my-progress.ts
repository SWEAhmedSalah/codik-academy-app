import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Session, Submission } from '../../core/models/session.model';
import { SubmissionStatus } from '../../core/constants/app.constants';

@Component({
  selector: 'app-my-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-progress.html'
})
export class MyProgress implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  isLoading = true;
  sessions: Session[] = [];
  submissions: Submission[] = [];
  courseProgress = 0;
  sessionsAttended = 0;
  totalSessions = 0;
  assignmentsCompleted = 0;
  totalAssignments = 0;
  acceptedCount = 0;
  pendingCount = 0;
  needsReworkCount = 0;

  async ngOnInit(): Promise<void> {
    try {
      this.isLoading = true;
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        const studentName = user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'Student';
        this.sessions = await this.supabaseService.getSessions();
        this.submissions = await this.supabaseService.getStudentSubmissions(studentName);

        this.totalSessions = this.sessions.length;
        this.totalAssignments = this.sessions.length;
        this.assignmentsCompleted = this.submissions.length;
        this.sessionsAttended = this.submissions.length;

        this.acceptedCount = this.submissions.filter(s => s.status === SubmissionStatus.ACCEPTED).length;
        this.pendingCount = this.submissions.filter(s => s.status === SubmissionStatus.PENDING).length;
        this.needsReworkCount = this.submissions.filter(s => s.status === SubmissionStatus.NEEDS_REWORK).length;

        if (this.totalAssignments > 0) {
          this.courseProgress = Math.round((this.assignmentsCompleted / this.totalAssignments) * 100);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getSubmissionForSession(sessionId: number): Submission | undefined {
    return this.submissions.find(s => s.session_id === sessionId);
  }
}

