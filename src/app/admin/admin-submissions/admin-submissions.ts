import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { Submission } from '../../core/models/session.model';

@Component({
  selector: 'app-admin-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-submissions.html'
})
export class AdminSubmissions implements OnInit {
  private supabaseService = inject(SupabaseService);

  submissions: Submission[] = [];
  isLoading = true;

  async ngOnInit() {
    await this.loadSubmissions();
  }

  async loadSubmissions() {
    this.isLoading = true;
    try {
      this.submissions = await this.supabaseService.getAllSubmissions();
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async changeStatus(id: string, status: 'Accepted' | 'Needs Rework', feedback?: string) {
    try {
      this.isLoading = true;

      await this.supabaseService.updateSubmission(id, status, feedback || '');

      // Update status locally for immediate UI update
      const sub = this.submissions.find(s => s.id === id);
      if (sub) {
        sub.status = status;
        sub.feedback = feedback;
        sub.showFeedback = false;
      }

    } catch (error) {
      console.error('Error updating submission status:', error);
      alert('Error updating submission. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }
}

