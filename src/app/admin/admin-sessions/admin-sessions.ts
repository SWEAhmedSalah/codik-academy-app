import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { Session } from '../../core/models/session.model';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-sessions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-sessions.html'
})
export class AdminSessions implements OnInit {
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);

  sessions: Session[] = [];
  sessionForm!: FormGroup;
  isLoading = false;

  isEditMode = false;
  editingSessionId: number | null = null;

  hoursOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  minutesOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  ngOnInit() {
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
    const h = Number(this.sessionForm.get('duration_hours')?.value) || 0;
    const m = Number(this.sessionForm.get('duration_minutes')?.value) || 0;
    return (h * 60) + m;
  }

  initForm() {
    this.sessionForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      order_index: ['', [Validators.required, Validators.min(1)]],
      status: ['Draft'],
      student_status: ['Upcoming'],
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
  }

  noFutureDateValidator(control: AbstractControl) {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return { futureDate: true };
    }
    return null;
  }

  noPastDateValidator(control: AbstractControl) {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { pastDate: true };
    }
    return null;
  }

  editSession(session: Session) {
    this.isEditMode = true;
    this.editingSessionId = session.id;

    let h = 1, m = 30;
    if (session.duration) {
      const match = session.duration.match(/(\d+)h (\d+)m/);
      if (match) { h = Number(match[1]); m = Number(match[2]); }
    }

    this.sessionForm.patchValue({
      title: session.title,
      description: session.description,
      order_index: session.order_index,
      status: session.status,
      student_status: session.student_status || 'Upcoming',
      recorded_date: session.recorded_date || '',
      duration_hours: h,
      duration_minutes: m,
      recording_link: session.recording_link,
      slide_link: session.slide_link,
      assets_link: session.assets_link,
      assignment_title: session.assignment_title || '',
      assignment_description: session.assignment_description || '',
      assignment_due_date: session.assignment_due_date || ''
    });
  }

  async deleteSession(id: number) {
    const confirmDelete = confirm('Are you sure you want to delete this session? This action cannot be undone.');

    if (confirmDelete) {
      try {
        await this.supabaseService.deleteSession(id);
        alert('Session deleted successfully! 🗑️');

        if (this.isEditMode && this.editingSessionId === id) {
          this.openAddMode();
        }

        this.loadSessions();
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Error deleting session.');
      }
    }
  }

  async onSubmit() {
    if (this.sessionForm.invalid) return;

    this.isLoading = true;
    try {
      const formValues = this.sessionForm.value;
      const formattedDuration = `${formValues.duration_hours}h ${formValues.duration_minutes}m`;

      const sessionData = {
        title: formValues.title,
        description: formValues.description,
        order_index: formValues.order_index,
        status: formValues.status,
        student_status: formValues.student_status,
        recorded_date: formValues.recorded_date || null,
        duration: formattedDuration,
        recording_link: formValues.recording_link,
        slide_link: formValues.slide_link,
        assets_link: formValues.assets_link,
        assignment_title: formValues.assignment_title,
        assignment_description: formValues.assignment_description,
        assignment_due_date: formValues.assignment_due_date || null
      };

      if (this.isEditMode && this.editingSessionId) {
        await this.supabaseService.updateSession(this.editingSessionId, sessionData);
        alert('Session Updated successfully! ✏️');
      } else {
        await this.supabaseService.addSession(sessionData);
        alert('Session Added successfully! 🎉');
      }

      this.openAddMode();
      this.loadSessions();
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  openAddMode() {
    this.isEditMode = false;
    this.editingSessionId = null;

    this.sessionForm.reset({
      status: 'Draft',
      duration_hours: 1,
      duration_minutes: 30
    });
  }

  async loadSessions() {
    try {
      this.sessions = await this.supabaseService.getSessions();
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

}
