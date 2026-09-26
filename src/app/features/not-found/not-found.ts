import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-not-found',
  template: `
    <section class="page empty-state">
      <span class="empty-mark" aria-hidden="true">◌</span>
      <p class="eyebrow">A page out of place</p>
      <h1>We couldn't find that page.</h1>
      <a class="button button-primary" routerLink="/">Return home</a>
    </section>
  `,
})
export class NotFound {}