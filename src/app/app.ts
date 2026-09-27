import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { JournalService } from './core/services/journal.service';

const THEME_STORAGE_KEY = 'daily-dot.theme.v1';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  template: `
    @if (isAuthRoute()) {
      <router-outlet />
    } @else {
    <a class="skip-link" href="#main-content">Skip to content</a>
    <div class="app-shell" [class.theme-dark]="darkMode()">
      <aside class="side-rail" aria-label="Primary navigation">
        <a class="brand-lockup" routerLink="/" aria-label="Daily Dot home">
          <span class="brand-mark"><span></span></span>
          <span class="brand-name">daily<span>dot</span></span>
        </a>
        <div class="nav-caption">YOUR SPACE</div>
        <nav class="primary-nav">
          <a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page">
            <span class="nav-icon" aria-hidden="true">⌂</span><span>Home</span>
          </a>
          <a routerLink="/journal" [class.is-active]="journalSectionActive()" [attr.aria-current]="journalSectionActive() ? 'page' : null">
            <span class="nav-icon" aria-hidden="true">▤</span><span>My Journal</span>
          </a>
          <a class="nav-new" routerLink="/journal/new" routerLinkActive="is-active" ariaCurrentWhenActive="page">
            <span class="nav-icon" aria-hidden="true">＋</span><span>New Journal</span>
          </a>
        </nav>
        <div class="rail-footer">
          @if (auth.user(); as user) {
            <div class="local-profile">
              <span class="profile-initial">{{ user.email?.[0] ?? 'A' }}</span>
              <span><strong>{{ user.email ?? 'Your account' }}</strong><small>Private account</small></span>
            </div>
            @if (signOutError()) {
              <p class="field-error" role="alert">{{ signOutError() }}</p>
            }
            <button class="theme-toggle sign-out-button" type="button" (click)="signOut()">Sign out</button>
          }
          <button class="theme-toggle" type="button" (click)="toggleTheme()" [attr.aria-label]="darkMode() ? 'Switch to light theme' : 'Switch to dark theme'" [attr.title]="darkMode() ? 'Switch to light theme' : 'Switch to dark theme'">
            <span aria-hidden="true">{{ darkMode() ? '☼' : '◐' }}</span>
            <span>{{ darkMode() ? 'Light theme' : 'Dark theme' }}</span>
          </button>
        </div>
      </aside>
      <main id="main-content" class="main-content">
        <div class="mobile-brand-row">
          <a class="brand-lockup" routerLink="/" aria-label="Daily Dot home">
            <span class="brand-mark"><span></span></span>
            <span class="brand-name">daily<span>dot</span></span>
          </a>
          <button class="mobile-theme-toggle" type="button" (click)="toggleTheme()" [attr.aria-label]="darkMode() ? 'Switch to light theme' : 'Switch to dark theme'">
            <span aria-hidden="true">{{ darkMode() ? '☼' : '◐' }}</span>
          </button>
        </div>
        <nav class="mobile-nav" aria-label="Primary navigation">
          <a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page">Home</a>
          <a routerLink="/journal" [class.is-active]="journalSectionActive()" [attr.aria-current]="journalSectionActive() ? 'page' : null">My Journal</a>
          <a routerLink="/journal/new" routerLinkActive="is-active" ariaCurrentWhenActive="page">＋ New</a>
          @if (auth.user()) {
            <button type="button" (click)="signOut()">Sign out</button>
          }
        </nav>
        @if (signOutError()) {
          <p class="field-error" role="alert">{{ signOutError() }}</p>
        }
        @if (journal.error()) {
          <div class="notice notice-error" role="alert">
            <span>{{ journal.error() }}</span>
            @if (auth.state().status === 'authenticated') {
              <button class="text-button" type="button" (click)="retryJournalLoad()">Retry</button>
            }
          </div>
        }
        <router-outlet />
      </main>
    </div>
    }
  `,
})
export class App {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly journal = inject(JournalService);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  readonly isAuthRoute = computed(() => this.currentUrl().split(/[?#]/)[0].startsWith('/auth/'));
  readonly signOutError = signal('');
  readonly darkMode = signal(localStorage.getItem(THEME_STORAGE_KEY) === 'dark');
  readonly journalSectionActive = computed(() => {
    const path = this.currentUrl().split(/[?#]/)[0];
    return path === '/journal' || (path.startsWith('/journal/') && path !== '/journal/new');
  });

  toggleTheme(): void {
    const dark = !this.darkMode();
    this.darkMode.set(dark);
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  }

  async signOut(): Promise<void> {
    this.signOutError.set('');
    const result = await this.auth.signOut();
    if (result.status === 'error') {
      this.signOutError.set(result.message);
      return;
    }
    await this.router.navigateByUrl('/auth/sign-in');
  }

  async retryJournalLoad(): Promise<void> {
    await this.journal.retryLoad();
  }
}
