import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { Session, Submission } from '../../core/models/session.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
  private supabaseService = inject(SupabaseService);

  isLoading = true;

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
  prLinks: { [sessionId: number]: string } = {};

  // Dynamic cards
  currentSession: any = null;
  latestAssignment: any = null;

  // Static announcements
  recentAnnouncements = [
    {
      title: 'Session Time Change',
      date: '2 Jul 2026',
      message: 'Starting from next week, all sessions will begin at 8:00 PM instead of 7:00.',
      icon: 'megaphone'
    },
    {
      title: 'New Assignment Added',
      date: '1 Jul 2026',
      message: 'Task 6 is now available. Check it out and good luck!',
      icon: 'clipboard'
    }
  ];

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      this.isLoading = true;

      const user = await this.supabaseService.getCurrentUser();
      if (!user) return;

      this.studentName = user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'Student';

      this.sessions = await this.supabaseService.getSessions();
      this.mySubmissions = await this.supabaseService.getStudentSubmissions(user.id);

      this.totalSessions = this.sessions.length;
      this.totalAssignments = this.sessions.length;

      this.assignmentsCompleted = this.mySubmissions.length;
      this.sessionsAttended = this.mySubmissions.length;

      if (this.totalAssignments > 0) {
        this.courseProgress = Math.round((this.assignmentsCompleted / this.totalAssignments) * 100);
      }

      const unsubmittedSessions = this.sessions.filter(s =>
        !this.mySubmissions.find(sub => sub.session_id === s.id)
      );

      if (unsubmittedSessions.length > 0) {
         const targetSession = unsubmittedSessions[0];

         this.currentSession = {
            number: targetSession.order_index,
            title: targetSession.title,
            recordedDate: 'N/A',
            duration: 'N/A'
         };

         this.latestAssignment = {
            sessionId: targetSession.id,
            title: `Task ${targetSession.order_index}: ${targetSession.title}`,
            description: targetSession.description || 'Complete the assignment for this session.',
            dueDate: 'Pending',
            daysLeft: 0
         };
      } else {
         this.currentSession = null;
         this.latestAssignment = null;
      }

    } catch (error) {
      console.error('Error loading dynamic dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getSubmissionForSession(sessionId: number) {
    return this.mySubmissions.find(sub => sub.session_id === sessionId);
  }

  async submitAssignment(sessionId: number) {
    const prLink = this.prLinks[sessionId];
    if (!prLink) return;

    try {
      this.isLoading = true;
      const user = await this.supabaseService.getCurrentUser();
      if (!user) return;

      await this.supabaseService.submitTask({
        session_id: sessionId,
        student_id: user.id,
        student_name: this.studentName,
        pr_link: prLink,
        status: 'Pending'
      });

      await this.loadDashboardData();
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
