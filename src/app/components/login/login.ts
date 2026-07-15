import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { APP_CONSTANTS, UserRole } from '../../core/constants/app.constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  readonly t = inject(TranslationService);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(APP_CONSTANTS.VALIDATION.MIN_PASSWORD_LENGTH)]]
    });
  }

  async ngOnInit(): Promise<void> {
    // Check if user is already authenticated
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user && user.email) {
        // User is already logged in, redirect to their dashboard
        const role = await this.supabaseService.getUserRole(user.email);
        this.navigateByRole(role);
      }
    } catch (error) {
      // User is not authenticated, stay on login page
      console.log('User not authenticated');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.loginForm.value;

      await this.supabaseService.signIn(email, password);
      const role = await this.supabaseService.getUserRole(email);

      this.navigateByRole(role);
    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMessage = this.t.t('error.loginFailed');
    } finally {
      this.isLoading = false;
    }
  }

  private navigateByRole(role: UserRole): void {
    if (role === UserRole.ADMIN) {
      this.router.navigate([APP_CONSTANTS.ROUTES.ADMIN]);
    } else {
      this.router.navigate([APP_CONSTANTS.ROUTES.STUDENT]);
    }
  }
}
