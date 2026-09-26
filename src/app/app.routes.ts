import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./features/home/dashboard').then((component) => component.Dashboard),
		title: 'Home | Daily Dot',
	},
	{
		path: 'journal',
		loadComponent: () =>
			import('./features/journal/journal-history').then(
				(component) => component.JournalHistory,
			),
		title: 'My Journal | Daily Dot',
	},
	{
		path: 'journal/new',
		loadComponent: () =>
			import('./features/journal/journal-editor').then(
				(component) => component.JournalEditor,
			),
		title: 'New Journal Entry | Daily Dot',
	},
	{
		path: 'journal/:id/edit',
		loadComponent: () =>
			import('./features/journal/journal-editor').then(
				(component) => component.JournalEditor,
			),
		title: 'Edit Journal Entry | Daily Dot',
	},
	{
		path: 'journal/:id',
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
