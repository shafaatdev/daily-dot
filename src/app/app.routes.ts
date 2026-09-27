import { Routes } from '@angular/router';
import { anonymousOnlyGuard, authenticatedGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{
		path: 'auth/sign-in',
		canActivate: [anonymousOnlyGuard],
		loadComponent: () => import('./features/auth/sign-in').then((component) => component.SignInPage),
		title: 'Sign In | Daily Dot',
	},
	{
		path: 'auth/sign-up',
		canActivate: [anonymousOnlyGuard],
		loadComponent: () => import('./features/auth/sign-up').then((component) => component.SignUpPage),
		title: 'Create Account | Daily Dot',
	},
	{
		path: 'auth/reset-password',
		loadComponent: () => import('./features/auth/reset-password').then((component) => component.ResetPasswordPage),
		title: 'Reset Password | Daily Dot',
	},
	{
		path: '',
		canActivate: [authenticatedGuard],
		loadComponent: () =>
			import('./features/home/dashboard').then((component) => component.Dashboard),
		title: 'Home | Daily Dot',
	},
	{
		path: 'journal',
		canActivate: [authenticatedGuard],
		loadComponent: () =>
			import('./features/journal/journal-history').then(
				(component) => component.JournalHistory,
			),
		title: 'My Journal | Daily Dot',
	},
	{
		path: 'journal/new',
		canActivate: [authenticatedGuard],
		loadComponent: () =>
			import('./features/journal/journal-editor').then(
				(component) => component.JournalEditor,
			),
		title: 'New Journal Entry | Daily Dot',
	},
	{
		path: 'journal/:id/edit',
		canActivate: [authenticatedGuard],
		loadComponent: () =>
			import('./features/journal/journal-editor').then(
				(component) => component.JournalEditor,
			),
		title: 'Edit Journal Entry | Daily Dot',
	},
	{
		path: 'journal/:id',
		canActivate: [authenticatedGuard],
		loadComponent: () =>
			import('./features/journal/journal-detail').then(
				(component) => component.JournalDetail,
			),
		title: 'Journal Entry | Daily Dot',
	},
	{
		path: '**',
		loadComponent: () =>
			import('./features/not-found/not-found').then(
				(component) => component.NotFound,
			),
		title: 'Page Not Found | Daily Dot',
	},
];
