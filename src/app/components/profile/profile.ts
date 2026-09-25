import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Session, Submission } from '../../core/models/session.model';
import { AttendanceStatus, SubmissionStatus } from '../../core/constants/app.constants';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html'
})
export class Profile implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  isLoading = true;
  userName = '';
  userEmail = '';
  githubUsername = '';
  linkedIn = '';
  courseProgress = 0;
  sessionsAttended = 0;
  totalSessions = 0;
  assignmentsCompleted = 0;
  totalAssignments = 0;

  async ngOnInit(): Promise<void> {
    try {
      this.isLoading = true;
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        this.userEmail = user.email || '';
        this.userName = user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'Student';
        this.githubUsername = user.user_metadata?.['github_username'] || '';
        this.linkedIn = user.user_metadata?.['linkedin'] || '';

        const [sessions, submissions, attendance] = await Promise.all([
          this.supabaseService.getSessions(),
          this.supabaseService.getStudentSubmissions(this.userName),
          this.supabaseService.getStudentAttendance(this.userName)
        ]);

        this.totalSessions = sessions.length;
        this.totalAssignments = sessions.filter(session => !!session.assignment_title).length;
        this.assignmentsCompleted = submissions.filter(
          submission => submission.status === SubmissionStatus.ACCEPTED
        ).length;
        this.sessionsAttended = attendance.filter(
          record => record.status === AttendanceStatus.PRESENT
        ).length;

        if (this.totalAssignments > 0) {
          this.courseProgress = Math.round((this.assignmentsCompleted / this.totalAssignments) * 100);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
