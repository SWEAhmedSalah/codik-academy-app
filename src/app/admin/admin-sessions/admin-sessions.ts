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
    return new Date().toISOString().split('T')[0];
  }

  get minAllowedDate(): string {
    return new Date().toISOString().split('T')[0];
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
      recorded_date: ['', [this.noFutureDateValidator]],
      duration_hours: [1],
      duration_minutes: [30],
      recording_link: [''],
      slide_link: [''],
      assets_link: [''],
      assignment_title: [''],
      assignment_description: [''],
      assignment_due_date: ['', [this.noPastDateValidator]]
    });

    // No auto-override: admin's manual student_status selection is always respected
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

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate < today ? { pastDate: true } : null;
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
      assignment_due_date: session.assignment_due_date || ''
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
        title: formValues.title,
        description: formValues.description,
        order_index: formValues.order_index,
        status: formValues.status,
        student_status: studentStatus,
        recorded_date: formValues.recorded_date || null,
        duration: `${formValues.duration_hours}h ${formValues.duration_minutes}m`,
        recording_link: formValues.recording_link,
        slide_link: formValues.slide_link,
        assets_link: formValues.assets_link,
        assignment_title: formValues.assignment_title,
        assignment_description: formValues.assignment_description,
        assignment_due_date: formValues.assignment_due_date || null
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

    this.sessionForm.reset({
      status: SessionStatus.DRAFT,
      student_status: StudentSessionStatus.UPCOMING,
      duration_hours: 1,
      duration_minutes: 30
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
