import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { StudentStateService } from '../../core/services/student-state';
import { TranslationService } from '../../core/services/translation.service';
import { Session } from '../../core/models/session.model';

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

  async ngOnInit(): Promise<void> {
    try {
      this.sessions = await this.supabaseService.getPublishedSessions();

      // Select first session by default
      if (this.sessions.length > 0) {
        this.stateService.selectedSession.set(this.sessions[0]);
      }

    } catch (error) {
      console.error('Error loading student sessions', error);
    }
  }

  onSessionSelect(session: Session): void {
    this.stateService.selectedSession.set(session);
  }
}
