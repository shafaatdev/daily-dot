import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface SignUpForm {
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-sign-up',
  template: `
    <main class="auth-page">
      <section class="auth-aside" aria-label="Daily Dot">
        <a class="brand-lockup" routerLink="/" aria-label="Daily Dot home">
          <span class="brand-mark"><span></span></span>
          <span class="brand-name">daily<span>dot</span></span>
        </a>
        <p class="eyebrow">A quieter corner of your day</p>
        <h1>Make room for what matters.</h1>
        <p class="auth-aside-copy">A little space to notice, remember, and begin again.</p>
      </section>
      <section class="auth-content">
        <div class="auth-form-wrap">
          @if (confirmationSent()) {
            <p class="eyebrow">One more step</p>
            <h2>Check your inbox</h2>
            <p class="auth-lede">If your address can be registered, Supabase will send a confirmation link. Follow it to finish creating your account.</p>
            <a class="button button-primary auth-submit" routerLink="/auth/sign-in">Return to sign in</a>
          } @else {
            <p class="eyebrow">Start your journal</p>
            <h2>Create an account</h2>
            <p class="auth-lede">Your entries will be private to your account.</p>
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
                <input type="password" autocomplete="new-password" formControlName="password" required />
                <span class="auth-help">Use at least 8 characters.</span>
              </label>
              <label class="form-field">
                <span class="field-label">Confirm password</span>
                <input type="password" autocomplete="new-password" formControlName="confirmPassword" required />
                @if (form.hasError('passwordMismatch') && form.controls.confirmPassword.touched) {
                  <span class="field-error">Passwords do not match.</span>
                }
              </label>
              <button class="button button-primary auth-submit" type="submit" [disabled]="busy() || form.invalid">
                {{ busy() ? 'Creating account…' : 'Create account' }}
              </button>
            </form>
            <p class="auth-switch">Already have an account? <a routerLink="/auth/sign-in">Sign in</a></p>
          }
        </div>
      </section>
    </main>
  `,
})
export class SignUpPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly confirmationSent = signal(false);
  readonly form = new FormGroup<SignUpForm>(
    {
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [passwordsMatch] },
  );

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;

    this.busy.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    const result = await this.authService.signUp(email, password);
    this.busy.set(false);

    if (result.status === 'error') {
      this.error.set(result.message);
    } else if (result.status === 'confirmation-required') {
      this.confirmationSent.set(true);
    } else {
      await this.router.navigateByUrl('/');
    }
  }
}

const passwordsMatch: ValidatorFn = (control): ValidationErrors | null => {
  const form = control as FormGroup<SignUpForm>;
  return form.controls.password.value === form.controls.confirmPassword.value
    ? null
    : { passwordMismatch: true };
};