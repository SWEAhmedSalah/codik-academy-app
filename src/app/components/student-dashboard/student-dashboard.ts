import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface ContinueLearningData {
  courseName: string;
  sessionLabel: string;
  sessionTitle: string;
  logoUrl: string;
  logoAlt: string;
}

interface CurrentAssignmentData {
  title: string;
  module: string;
  dueDate: string;
  steps: string[];
}

interface NextSessionData {
  sessionLabel: string;
  title: string;
  date: string;
  duration: string;
  topics: string[];
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-dashboard.html'
})
export class StudentDashboard {
  readonly courseProgress = 33;
  readonly completedSessions = 1;
  readonly totalSessions = 3;
  readonly completedAssignments = 1;
  readonly totalAssignments = 3;

  readonly continueLearning: ContinueLearningData = {
    courseName: 'Spring Framework',
    sessionLabel: 'Session 3',
    sessionTitle: 'Bean Scopes and Lifecycle',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Spring_Framework_Logo_2018.svg',
    logoAlt: 'Spring Framework Logo'
  };

  readonly currentAssignment: CurrentAssignmentData = {
    title: 'Task 3.1 - Bean Scopes',
    module: 'Spring Core',
    dueDate: '20 Jul 2026',
    steps: [
      'Task 3.1 - Bean Scopes',
      'Define a new implementation for NotificationService.',
      'Create singleton, prototype, and request-scoped beans.',
      'Inject each bean into a controller and log lifecycle events.',
      'Compare behavior and submit your findings in README format.'
    ]
  };

  readonly nextSession: NextSessionData = {
    sessionLabel: 'Session 4',
    title: 'Spring MVC',
    date: '22 Jul 2026',
    duration: '1h 30m',
    topics: [
      'What is Spring MVC',
      'Request Mapping and Controllers',
      'Spring MVC Benefits',
      'Building your first MVC endpoint'
    ]
  };

  watchSession(): void {
    console.log('Watch current session');
  }

  viewMaterials(): void {
    console.log('View session materials');
  }

  startAssignment(): void {
    console.log('Start assignment');
  }

  openAssignmentResources(): void {
    console.log('Open assignment resources');
  }

  previewNextSession(): void {
    console.log('Preview next session');
  }

  reportIssue(): void {
    console.log('Open bug report');
  }
}

