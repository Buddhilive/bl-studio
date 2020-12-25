import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'BL Studio';
  isHome = true;
  constructor(private router: Router) {
    router.events.subscribe((val) => {
      //console.log(val);
      if (val instanceof NavigationEnd) {
        const navUrl = val.url;
        switch (navUrl) {
          case '/melody':
            this.title = 'BL Studio | Melody';
            break;

          case '/voicekey':
            this.title = 'BL Studio | Voice Key';
            break;

            case '/tonebreaker':
              this.title = 'BL Studio | ToneBreaker';
              break;

          default:
            this.title = 'BL Studio';
            break;
        }
        if(navUrl !== '/') {
          this.isHome = false;
        }
        //console.log(navUrl);
      }
      //console.log(val instanceof NavigationEnd);
    });
  }

  navigateTo(){
    this.router.navigate(['/']);
    this.isHome = true;
  }
}
