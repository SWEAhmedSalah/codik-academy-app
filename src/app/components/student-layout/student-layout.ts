import { Component } from '@angular/core';
import { SessionsSidebar } from '../sessions-sidebar/sessions-sidebar';
import { SessionDetails } from '../session-details/session-details';
import { Dashboard } from '../dashboard/dashboard';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [SessionsSidebar, SessionDetails, Dashboard, Sidebar],
  templateUrl: './student-layout.html'
})
export class StudentLayout {
}
