import { Injectable, signal } from '@angular/core';
import { Session, Course } from '../models/session.model';

export type StudentView = 'dashboard' | 'course' | 'session-details' | 'progress' | 'profile' | 'courses' | 'course-details';

@Injectable({
  providedIn: 'root'
})
export class StudentStateService {
  selectedSession = signal<Session | null>(null);
  selectedCourse = signal<Course | null>(null);
  selectedCourseId = signal<number | null>(null);
  currentView = signal<StudentView>('dashboard');

  navigateTo(view: StudentView): void {
    this.currentView.set(view);
  }

  openSession(session: Session): void {
    this.selectedSession.set(session);
    this.currentView.set('session-details');
  }

  openCourse(courseId: number): void {
    this.selectedCourseId.set(courseId);
    this.currentView.set('course-details');
  }

  openCourses(): void {
    this.currentView.set('courses');
  }
}
