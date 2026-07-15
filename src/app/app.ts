import { Component } from '@angular/core';
import { Sidebar } from './components/sidebar/sidebar';
import { Dashboard } from './components/dashboard/dashboard';
import { SessionsSidebar } from './components/sessions-sidebar/sessions-sidebar';
import { AdminLayout } from '../app/admin/admin-layout/admin-layout';
import { SessionDetails } from './components/session-details/session-details';
import { AdminSubmissions } from "./admin/admin-submissions/admin-submissions";
import { AdminStatistics } from "./admin/admin-statistics/admin-statistics";
import { Login } from './components/login/login';
import { RouterOutlet } from "@angular/router";
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Sidebar, Dashboard, SessionsSidebar, AdminLayout, SessionDetails, AdminSubmissions, AdminStatistics, Login, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  title = 'codik-platform';
}