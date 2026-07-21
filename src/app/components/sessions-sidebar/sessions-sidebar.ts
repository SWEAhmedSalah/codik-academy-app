import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { StudentStateService } from '../../core/services/student-state';
import { TranslationService } from '../../core/services/translation.service';
import { Session, Submission } from '../../core/models/session.model';
import { StudentSessionStatus } from '../../core/constants/app.constants';

@Component({
  selector: 'app-sessions-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sessions-sidebar.html'
})
export class SessionsSidebar implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  readonly stateService = inject(StudentStateService);
  readonly t = inject(TranslationService);

  sessions: Session[] = [];
  submissions: Submission[] = [];

  async ngOnInit(): Promise<void> {
    try {
      this.sessions = await this.supabaseService.getPublishedSessions();

      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        const studentName = user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'Student';
        this.submissions = await this.supabaseService.getStudentSubmissions(studentName);
      }
    } catch (error) {
      console.error('Error loading student sessions', error);
    }
  }

  onSessionSelect(session: Session): void {
    this.stateService.openSession(session);
  }

  getSubmissionForSession(sessionId: number): Submission | undefined {
    return this.submissions.find(s => s.session_id === sessionId);
  }

  hasRecording(session: Session): boolean {
    return !!session.recording_link;
  }

  getResourcesCount(session: Session): number {
    let count = 0;
    if (session.slide_link) count++;
    if (session.assets_link) count++;
    if (session.recording_link) count++;
    return count;
  }

  /**
   * Get the session status from the database value
   */
  getSessionStatus(session: Session): string {
    return session.student_status || StudentSessionStatus.UPCOMING;
  }

  /**
   * Sequence-based locking for upcoming sessions.
   * If the admin has explicitly set is_locked on the session, respect that.
   * Otherwise: Completed/In Progress/submitted sessions are unlocked,
   * and only the first upcoming session is unlocked.
   */
  isSessionLocked(session: Session): boolean {
    // If admin explicitly locked it, it's locked
    if (session.is_locked) return true;

    const status = this.getSessionStatus(session);

    // Completed or In Progress sessions are always accessible
    if (status === 'Completed' || status === 'In Progress') return false;

    // Sessions with a submission are always accessible
    if (this.getSubmissionForSession(session.id)) return false;

    // For Upcoming sessions: only the first one (by order_index) is unlocked
    const upcomingSessions = this.sessions.filter(s => {
      const st = this.getSessionStatus(s);
      return st === 'Upcoming' && !this.getSubmissionForSession(s.id) && !s.is_locked;
    });

    if (upcomingSessions.length === 0) return true;

    // The first upcoming unlocked session is accessible
    return session.id !== upcomingSessions[0].id;
  }
}
