import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Session } from '../../core/models/session.model';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { SessionStatus, StudentSessionStatus, SUCCESS_MESSAGES } from '../../core/constants/app.constants';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-admin-sessions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './admin-sessions.html'
})
export class AdminSessions implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);
  readonly t = inject(TranslationService);

  sessions: Session[] = [];
  sessionForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  isEditMode = false;
  editingSessionId: number | null = null;
  isDrawerOpen = false;

  readonly SessionStatus = SessionStatus;
  readonly StudentSessionStatus = StudentSessionStatus;

  readonly hoursOptions = Array.from({ length: 13 }, (_, i) => i);
  readonly minutesOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  // Quill editor configuration
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link']
    ]
  };

  ngOnInit(): void {
    this.initForm();
    this.loadSessions();
  }

  get maxAllowedDate(): string {
    // No max restriction - allow future dates for scheduled sessions
    return '';
  }

  get minAllowedDateTime(): string {
    // Return current Egypt time in datetime-local format
    return this.toEgyptDatetimeLocal(new Date().toISOString());
  }

  get isFutureRecordedDate(): boolean {
    const dateValue = this.sessionForm?.get('recorded_date')?.value;
    if (!dateValue) return false;
    const selected = new Date(dateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected > today;
  }

  get totalDurationMinutes(): number {
    if (!this.sessionForm) return 0;
    const hours = Number(this.sessionForm.get('duration_hours')?.value) || 0;
    const minutes = Number(this.sessionForm.get('duration_minutes')?.value) || 0;
    return (hours * 60) + minutes;
  }

  initForm(): void {
    this.sessionForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      order_index: ['', [Validators.required, Validators.min(1)]],
      status: [SessionStatus.DRAFT],
      student_status: [StudentSessionStatus.UPCOMING],
      recorded_date: [''],
      duration_hours: [1],
      duration_minutes: [30],
      recording_link: [''],
      slide_link: [''],
      assets_link: [''],
      assignment_title: [''],
      assignment_description: [''],
      assignment_due_date: ['', [this.noPastDateValidator.bind(this)]],
      is_locked: [false]
    });

    // When recorded_date changes, if it's a future date, force student_status to Upcoming
    this.sessionForm.get('recorded_date')?.valueChanges.subscribe(value => {
      if (value) {
        const selected = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected > today) {
          this.sessionForm.get('student_status')?.setValue(StudentSessionStatus.UPCOMING);
        }
      }
    });
  }

  noFutureDateValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate > today ? { futureDate: true } : null;
  }

  noPastDateValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (!control.value) return null;

    // Interpret the datetime-local value as Egypt time and compare to now
    const selectedUTC = this.egyptDatetimeToUTC(control.value);
    return selectedUTC < Date.now() ? { pastDate: true } : null;
  }

  /**
   * Get Egypt's UTC offset in minutes for a given date.
   */
  private getEgyptOffsetMinutes(date: Date): number {
    const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
    const egyptStr = date.toLocaleString('en-US', { timeZone: 'Africa/Cairo' });
    return (new Date(egyptStr).getTime() - new Date(utcStr).getTime()) / 60000;
  }

  /**
   * Convert a datetime-local value (e.g. "2026-07-26T12:30") to UTC timestamp (ms),
   * interpreting the input as Egypt time (Africa/Cairo).
   */
  private egyptDatetimeToUTC(datetimeLocal: string): number {
    const [datePart, timePart] = datetimeLocal.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create a UTC date with the same numbers, then subtract Egypt's offset
    const asUTC = Date.UTC(year, month - 1, day, hours, minutes, 0);
    const egyptOffset = this.getEgyptOffsetMinutes(new Date(asUTC));
    return asUTC - (egyptOffset * 60000);
  }

  /**
   * Convert a datetime-local value to a UTC ISO string, interpreting as Egypt time.
   */
  private toEgyptUTC(datetimeLocal: string): string {
    return new Date(this.egyptDatetimeToUTC(datetimeLocal)).toISOString();
  }

  /**
   * Convert a UTC date string from DB to datetime-local format in Egypt timezone.
   */
  private toEgyptDatetimeLocal(utcDateStr: string): string {
    const date = new Date(utcDateStr);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(date);

    const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  }

  openDrawer(): void {
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  editSession(session: Session): void {
    this.isEditMode = true;
    this.editingSessionId = session.id;
    this.clearMessages();

    let hours = 1, minutes = 30;
    if (session.duration) {
      const match = session.duration.match(/(\d+)h (\d+)m/);
      if (match) {
        hours = Number(match[1]);
        minutes = Number(match[2]);
      }
    }

    this.sessionForm.patchValue({
      title: session.title,
      description: session.description,
      order_index: session.order_index,
      status: session.status,
      student_status: session.student_status || StudentSessionStatus.UPCOMING,
      recorded_date: session.recorded_date || '',
      duration_hours: hours,
      duration_minutes: minutes,
      recording_link: session.recording_link,
      slide_link: session.slide_link,
      assets_link: session.assets_link,
      assignment_title: session.assignment_title || '',
      assignment_description: session.assignment_description || '',
      assignment_due_date: session.assignment_due_date
        ? this.toEgyptDatetimeLocal(session.assignment_due_date)
        : '',
      is_locked: session.is_locked || false
    });

    this.openDrawer();
  }

  async deleteSession(id: number): Promise<void> {
    if (!confirm(this.t.t('admin.deleteConfirm'))) {
      return;
    }

    try {
      this.isLoading = true;
      this.clearMessages();

      await this.supabaseService.deleteSession(id);
      this.successMessage = this.t.t('success.sessionDeleted');

      if (this.isEditMode && this.editingSessionId === id) {
        this.openAddMode();
      }

      await this.loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    try {
      const formValues = this.sessionForm.value;

      const studentStatus = formValues.student_status;

      const sessionData = {
        title: formValues.title?.trim(),
        description: formValues.description || null,
        order_index: Number(formValues.order_index),
        status: formValues.status,
        student_status: studentStatus,
        recorded_date: formValues.recorded_date || null,
        duration: `${formValues.duration_hours}h ${formValues.duration_minutes}m`,
        recording_link: formValues.recording_link?.trim() || null,
        slide_link: formValues.slide_link?.trim() || null,
        assets_link: formValues.assets_link?.trim() || null,
        assignment_title: formValues.assignment_title?.trim() || null,
        assignment_description: formValues.assignment_description || null,
        assignment_due_date: formValues.assignment_due_date
          ? this.toEgyptUTC(formValues.assignment_due_date)
          : null,
        is_locked: !!formValues.is_locked
      };

      if (this.isEditMode && this.editingSessionId) {
        await this.supabaseService.updateSession(this.editingSessionId, sessionData);
        this.successMessage = this.t.t('success.sessionUpdated');
      } else {
        await this.supabaseService.addSession(sessionData);
        this.successMessage = this.t.t('success.sessionAdded');
      }

      this.openAddMode();
      this.closeDrawer();
      await this.loadSessions();
    } catch (error) {
      console.error('Error saving session:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    } finally {
      this.isLoading = false;
    }
  }

  openAddMode(): void {
    this.isEditMode = false;
    this.editingSessionId = null;
    this.clearMessages();

    const nextOrder = this.sessions.length > 0
      ? Math.max(...this.sessions.map(s => s.order_index)) + 1
      : 1;

    this.sessionForm.reset({
      status: SessionStatus.DRAFT,
      student_status: StudentSessionStatus.UPCOMING,
      duration_hours: 1,
      duration_minutes: 30,
      is_locked: false,
      order_index: nextOrder
    });

    this.openDrawer();
  }

  async loadSessions(): Promise<void> {
    try {
      this.sessions = await this.supabaseService.getSessions();
    } catch (error) {
      console.error('Error loading sessions:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    }
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
