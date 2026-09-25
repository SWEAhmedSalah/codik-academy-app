import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Attendance, Session, Submission } from '../../core/models/session.model';
import { AttendanceStatus, SubmissionStatus } from '../../core/constants/app.constants';

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
  attendanceRecords: Attendance[] = [];
  courseProgress = 0;
  sessionsAttended = 0;
  totalSessions = 0;
  assignmentsCompleted = 0;
  totalAssignments = 0;
  acceptedCount = 0;
  pendingCount = 0;
  needsReworkCount = 0;

  readonly AttendanceStatus = AttendanceStatus;

  async ngOnInit(): Promise<void> {
    try {
      this.isLoading = true;
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        const studentName = user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'Student';
        const [sessions, submissions, attendance] = await Promise.all([
          this.supabaseService.getSessions(),
          this.supabaseService.getStudentSubmissions(studentName),
          this.supabaseService.getStudentAttendance(studentName)
        ]);

        this.sessions = sessions;
        this.submissions = submissions;
        this.attendanceRecords = attendance;

        this.totalSessions = this.sessions.length;
        this.totalAssignments = this.sessions.filter(session => !!session.assignment_title).length;
        this.assignmentsCompleted = this.submissions.filter(
          submission => submission.status === SubmissionStatus.ACCEPTED
        ).length;
        this.sessionsAttended = this.attendanceRecords.filter(
          record => record.status === AttendanceStatus.PRESENT
        ).length;

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
  getAttendanceForSession(sessionId: number): Attendance | undefined {
    return this.attendanceRecords.find(record => record.session_id === sessionId);
  }

  getAttendanceLabel(sessionId: number): string {
    const attendance = this.getAttendanceForSession(sessionId);
    if (!attendance) {
      return this.t.t('attendance.notMarked');
    }

    return attendance.status === AttendanceStatus.PRESENT
      ? this.t.t('attendance.present')
      : this.t.t('attendance.absent');
  }

  getAttendanceBadgeClass(sessionId: number): string {
    const attendance = this.getAttendanceForSession(sessionId);
    if (!attendance) {
      return 'bg-gray-50 text-gray-400';
    }

    return attendance.status === AttendanceStatus.PRESENT
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-red-50 text-red-700';
  }
}
