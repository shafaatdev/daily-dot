import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-sign-in',
  template: `
    <main class="auth-page">
      <section class="auth-aside" aria-label="Daily Dot">
        <a class="brand-lockup" routerLink="/" aria-label="Daily Dot home">
          <span class="brand-mark"><span></span></span>
          <span class="brand-name">daily<span>dot</span></span>
        </a>
        <p class="eyebrow">A quieter corner of your day</p>
        <h1>Make room for what matters.</h1>
        <p class="auth-aside-copy">Your journal, private and ready whenever you are.</p>
      </section>
      <section class="auth-content">
        <div class="auth-form-wrap">
          <p class="eyebrow">Welcome back</p>
          <h2>Sign in</h2>
          <p class="auth-lede">Continue to your journal.</p>

          @if (authUnavailable()) {
            <div class="notice notice-error" role="alert">
              Your session could not be checked. You can still try signing in.
              <button class="text-button" type="button" (click)="retrySession()">Retry</button>
            </div>
          }
          @if (error()) {
            <div class="notice notice-error" role="alert">{{ error() }}</div>
          }

          <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()">
            <label class="form-field">
              <span class="field-label">Email</span>
              <input type="email" autocomplete="email" formControlName="email" required />
            </label>
            <label class="form-field">
              <span class="field-label">Password</span>
              <input type="password" autocomplete="current-password" formControlName="password" required />
            </label>
            <button class="button button-primary auth-submit" type="submit" [disabled]="busy() || form.invalid">
              {{ busy() ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>
          <a class="auth-secondary-link" routerLink="/auth/reset-password">Forgot your password?</a>
          <p class="auth-switch">New to Daily Dot? <a routerLink="/auth/sign-up">Create an account</a></p>
        </div>
      </section>
    </main>
  `,
})
export class SignInPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly authUnavailable = computed(() => this.authService.state().status === 'error');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;

    this.busy.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    const result = await this.authService.signIn(email, password);
    this.busy.set(false);

    if (result.status === 'error') {
      this.error.set(result.message);
      return;
    }

    await this.router.navigateByUrl(this.getReturnUrl());
  }

  async retrySession(): Promise<void> {
    await this.authService.retrySession();
  }

  private getReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (
      !returnUrl ||
      !returnUrl.startsWith('/') ||
      returnUrl.startsWith('//') ||
      returnUrl.includes('\\') ||
      returnUrl.startsWith('/auth/')
    ) {
      return '/';
    }

    try {
      this.router.parseUrl(returnUrl);
      return returnUrl;
    } catch {
      return '/';
    }
  }
}