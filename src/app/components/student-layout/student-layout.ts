import { Component, inject } from '@angular/core';
import { SessionsSidebar } from '../sessions-sidebar/sessions-sidebar';
import { SessionDetails } from '../session-details/session-details';
import { Dashboard } from '../dashboard/dashboard';
import { Sidebar } from '../sidebar/sidebar';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [SessionsSidebar, SessionDetails, Dashboard, Sidebar],
  templateUrl: './student-layout.html'
})
export class StudentLayout {
  readonly t = inject(TranslationService);
}
