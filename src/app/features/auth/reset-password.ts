import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-reset-password',
  template: `
    <main class="auth-page">
      <section class="auth-aside" aria-label="Daily Dot">
        <a class="brand-lockup" routerLink="/" aria-label="Daily Dot home">
          <span class="brand-mark"><span></span></span>
          <span class="brand-name">daily<span>dot</span></span>
        </a>
        <p class="eyebrow">A quieter corner of your day</p>
        <h1>Your journal is waiting.</h1>
        <p class="auth-aside-copy">We’ll help you get back to it securely.</p>
      </section>
      <section class="auth-content">
        <div class="auth-form-wrap">
          @if (sessionLoading()) {
            <p class="eyebrow">Secure link</p>
            <h2>Checking your reset link</h2>
            <p class="auth-lede" role="status">Please wait while we confirm your session.</p>
          } @else if (isRecovery()) {
            <p class="eyebrow">Set a new password</p>
            <h2>Choose a new password</h2>
            <p class="auth-lede">Use at least 8 characters.</p>
            @if (error()) {
              <div class="notice notice-error" role="alert">{{ error() }}</div>
            }
            @if (success()) {
              <div class="notice" role="status">Your password has been updated.</div>
            }
            <form class="auth-form" [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
              <label class="form-field">
                <span class="field-label">New password</span>
                <input type="password" autocomplete="new-password" formControlName="password" required />
              </label>
              <button class="button button-primary auth-submit" type="submit" [disabled]="busy() || passwordForm.invalid">
                {{ busy() ? 'Updating…' : 'Update password' }}
              </button>
            </form>
          } @else {
            <p class="eyebrow">Account recovery</p>
            <h2>Reset your password</h2>
            <p class="auth-lede">Enter your email and we’ll send a secure reset link if an account matches.</p>
            @if (error()) {
              <div class="notice notice-error" role="alert">{{ error() }}</div>
            }
            @if (success()) {
              <div class="notice" role="status">If an account matches that email, a reset link is on its way.</div>
            }
            <form class="auth-form" [formGroup]="emailForm" (ngSubmit)="requestReset()">
              <label class="form-field">
                <span class="field-label">Email</span>
                <input type="email" autocomplete="email" formControlName="email" required />
              </label>
              <button class="button button-primary auth-submit" type="submit" [disabled]="busy() || emailForm.invalid">
                {{ busy() ? 'Sending…' : 'Send reset link' }}
              </button>
            </form>
          }
          <p class="auth-switch"><a routerLink="/auth/sign-in">Back to sign in</a></p>
        </div>
      </section>
    </main>
  `,
})
export class ResetPasswordPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly sessionLoading = computed(() => this.authService.state().status === 'loading');
  readonly isRecovery = computed(() => this.authService.state().status === 'authenticated');
  readonly busy = signal(false);
  readonly success = signal(false);
  readonly error = signal('');
  readonly emailForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });
  readonly passwordForm = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  async requestReset(): Promise<void> {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid || this.busy()) return;
    this.busy.set(true);
    this.success.set(false);
    this.error.set('');
    const result = await this.authService.requestPasswordReset(this.emailForm.controls.email.value);
    this.busy.set(false);
    this.setResult(result);
  }

  async updatePassword(): Promise<void> {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid || this.busy()) return;
    this.busy.set(true);
    this.success.set(false);
    this.error.set('');
    const result = await this.authService.updatePassword(this.passwordForm.controls.password.value);
    this.busy.set(false);
    this.setResult(result);
    if (result.status === 'success') await this.router.navigateByUrl('/');
  }

  private setResult(result: Awaited<ReturnType<AuthService['requestPasswordReset']>>): void {
    if (result.status === 'error') {
      this.error.set(result.message);
    } else {
      this.success.set(true);
    }
  }
}