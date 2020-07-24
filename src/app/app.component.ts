import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'BL Studio';
  constructor(private router: Router) {
    router.events.subscribe((val) => {
      //console.log(val);
      if (val instanceof NavigationEnd) {
        const navUrl = val.url;
        switch (navUrl) {
          case '/melody':
            this.title = 'BL Studio | Melody';
            break;

          default:
            this.title = 'BL Studio';
            break;
        }
      }
      //console.log(val instanceof NavigationEnd);
    });
  }
}
