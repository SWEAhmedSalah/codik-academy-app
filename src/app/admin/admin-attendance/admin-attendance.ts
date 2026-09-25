import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Session, Attendance } from '../../core/models/session.model';
import { AttendanceStatus } from '../../core/constants/app.constants';

interface SheetRow {
  studentName: string;
  presentCount: number;
  cells: Map<number, AttendanceStatus | null>;
}

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-attendance.html'
})
export class AdminAttendance implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  readonly AttendanceStatus = AttendanceStatus;

  isLoading = true;
  errorMessage = '';
  successMessage = '';

  sessions: Session[] = [];
  rows: SheetRow[] = [];
  filteredRows: SheetRow[] = [];
  searchText = '';

  /** Tracks which cell (studentName::sessionId) is currently saving. */
  private readonly savingCells = new Set<string>();

  get totalStudents(): number {
    return this.rows.length;
  }

  async ngOnInit(): Promise<void> {
    await this.loadSheet();
  }

  private async loadSheet(): Promise<void> {
    this.clearMessages();
    this.isLoading = true;

    try {
      const [sessions, studentNames, attendanceRecords] = await Promise.all([
        this.supabaseService.getSessions(),
        this.supabaseService.getStudentRoster(),
        this.supabaseService.getAllAttendance()
      ]);

      this.sessions = sessions;

      const byStudent = new Map<string, Map<number, AttendanceStatus>>();
      attendanceRecords.forEach((record: Attendance) => {
        if (!byStudent.has(record.student_name)) {
          byStudent.set(record.student_name, new Map());
        }
        byStudent.get(record.student_name)!.set(record.session_id, record.status);
      });

      this.rows = studentNames.map(studentName => {
        const cells = new Map<number, AttendanceStatus | null>();
        const statusMap = byStudent.get(studentName);
        sessions.forEach(session => {
          cells.set(session.id, statusMap?.get(session.id) ?? null);
        });
        return {
          studentName,
          cells,
          presentCount: Array.from(cells.values()).filter(status => status === AttendanceStatus.PRESENT).length
        };
      });

      this.applySearch();
    } catch (error) {
      console.error('Error loading attendance sheet:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    } finally {
      this.isLoading = false;
    }
  }

  applySearch(): void {
    const query = this.searchText.trim().toLowerCase();
    this.filteredRows = !query
      ? this.rows
      : this.rows.filter(row => row.studentName.toLowerCase().includes(query));
  }

  private cellKey(studentName: string, sessionId: number): string {
    return `${studentName}::${sessionId}`;
  }

  isCellSaving(studentName: string, sessionId: number): boolean {
    return this.savingCells.has(this.cellKey(studentName, sessionId));
  }

  /**
   * Cycle a cell's attendance status like a spreadsheet toggle:
   * Not Marked -> Present -> Absent -> Present -> ...
   */
  async toggleCell(row: SheetRow, sessionId: number): Promise<void> {
    const key = this.cellKey(row.studentName, sessionId);
    if (this.savingCells.has(key)) {
      return;
    }

    const current = row.cells.get(sessionId) ?? null;
    const next = current === AttendanceStatus.PRESENT
      ? AttendanceStatus.ABSENT
      : AttendanceStatus.PRESENT;

    this.clearMessages();
    this.savingCells.add(key);

    try {
      await this.supabaseService.markAttendance(sessionId, row.studentName, next);
      row.cells.set(sessionId, next);
      row.presentCount = Array.from(row.cells.values()).filter(status => status === AttendanceStatus.PRESENT).length;
      this.successMessage = this.t.t('success.attendanceUpdated');
    } catch (error) {
      console.error('Error marking attendance:', error);
      this.errorMessage = this.t.t('error.attendanceFailed');
    } finally {
      this.savingCells.delete(key);
    }
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
