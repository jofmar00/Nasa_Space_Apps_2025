import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    main { height: 100dvh; width: 100dvw }
  `
})
export class App {
  protected readonly title = signal('Space_Apps_Frontend');
}
