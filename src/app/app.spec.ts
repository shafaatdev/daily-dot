import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './core/services/auth.service';
import { JournalService } from './core/services/journal.service';

describe('App', () => {
  beforeEach(async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        {
          provide: AuthService,
          useValue: {
            state: signal({ status: 'anonymous' }),
            user: signal(null),
            signOut: vi.fn(async () => ({ status: 'success' })),
          },
        },
        {
          provide: JournalService,
          useValue: { error: signal(null), retryLoad: vi.fn(async () => undefined) },
        },
      ],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render primary navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.primary-nav')?.textContent).toContain('My Journal');
  });
});
