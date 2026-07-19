import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Session, Submission } from '../../core/models/session.model';

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

        const sessions: Session[] = await this.supabaseService.getSessions();
        const submissions: Submission[] = await this.supabaseService.getStudentSubmissions(this.userName);

        this.totalSessions = sessions.length;
        this.totalAssignments = sessions.length;
        this.assignmentsCompleted = submissions.length;
        this.sessionsAttended = submissions.length;

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

