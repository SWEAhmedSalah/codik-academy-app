import { Component, inject } from '@angular/core';
import { SessionsSidebar } from '../sessions-sidebar/sessions-sidebar';
import { SessionDetails } from '../session-details/session-details';
import { Dashboard } from '../dashboard/dashboard';
import { Sidebar } from '../sidebar/sidebar';
import { Profile } from '../profile/profile';
import { MyProgress } from '../my-progress/my-progress';
import { TranslationService } from '../../core/services/translation.service';
import { StudentStateService } from '../../core/services/student-state';
import { BugReport } from '../bug-report/bug-report';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [SessionsSidebar, SessionDetails, Dashboard, Sidebar, Profile, MyProgress, BugReport],
  templateUrl: './student-layout.html'
})
export class StudentLayout {
  readonly t = inject(TranslationService);
  readonly stateService = inject(StudentStateService);
}
