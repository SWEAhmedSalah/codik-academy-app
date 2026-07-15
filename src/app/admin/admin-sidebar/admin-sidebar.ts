import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';
import { SupabaseService } from '../../core/services/supabase';
import { APP_CONSTANTS } from '../../core/constants/app.constants';

@Component({
  selector: 'app-admin-sidebar',
  imports: [CommonModule],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css',
})
export class AdminSidebar implements OnInit {
  readonly t = inject(TranslationService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  isLoggingOut = false;
  userEmail = '';
  userName = '';

  async ngOnInit(): Promise<void> {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user?.email) {
        this.userEmail = user.email;
        // Extract name from email (before @)
        this.userName = user.email.split('@')[0];
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
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
