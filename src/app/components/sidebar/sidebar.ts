import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';
import { SupabaseService } from '../../core/services/supabase';
import { StudentStateService, StudentView } from '../../core/services/student-state';
import { APP_CONSTANTS } from '../../core/constants/app.constants';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html'
})
export class Sidebar implements OnInit {
  readonly t = inject(TranslationService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  readonly stateService = inject(StudentStateService);

  isLoggingOut = false;
  userEmail = '';
  userName = '';

  async ngOnInit(): Promise<void> {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user?.email) {
        this.userEmail = user.email;
        this.userName = user.email.split('@')[0];
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  navigateTo(view: StudentView): void {
    this.stateService.navigateTo(view);
  }

  isActive(view: StudentView): boolean {
    return this.stateService.currentView() === view;
  }

  async onLogout(): Promise<void> {
    try {
      this.isLoggingOut = true;
      await this.supabaseService.signOut();
      this.router.navigate([APP_CONSTANTS.ROUTES.LOGIN]);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.isLoggingOut = false;
    }
  }
}
