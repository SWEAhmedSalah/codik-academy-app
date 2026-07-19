import { Injectable, signal } from '@angular/core';
import { Session } from '../models/session.model';

export type StudentView = 'dashboard' | 'course' | 'session-details' | 'progress' | 'profile';

@Injectable({
  providedIn: 'root'
})
export class StudentStateService {
  selectedSession = signal<Session | null>(null);
  currentView = signal<StudentView>('dashboard');

  navigateTo(view: StudentView): void {
    this.currentView.set(view);
  }

  openSession(session: Session): void {
    this.selectedSession.set(session);
    this.currentView.set('session-details');
  }
}
