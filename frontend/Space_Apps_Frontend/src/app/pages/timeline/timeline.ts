import { CommonModule } from '@angular/common';
import { Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { StarBackground } from '../../components/star-background/star-background';
import { NavigationStart, Router } from '@angular/router';
import { TextToSpeechService } from '../../services/text-to-speech.service';
import { AsteroidService } from '../../services/asteroid.service';

@Component({
  standalone: true,
  imports: [CommonModule, StarBackground],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss'
})
export class Timeline implements OnInit, OnDestroy {
  private readonly router = inject(Router)
  private readonly ttp = inject(TextToSpeechService)
  private readonly asteroidService = inject(AsteroidService)

  public imgPath = signal('')
  public imgId = signal('')
  public lat = signal<number | undefined>(undefined)
  public lng = signal<number | undefined>(undefined)
  public radius = signal<number | undefined>(undefined)
  public prediction = signal('')

  palabras: string[] = [];
  palabrasMostradas: string[] = [];
  indice = 0;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.imgId.set(nav.extras.state['id'])
      this.lat.set(nav.extras.state['lat'])
      this.lng.set(nav.extras.state['lng'])
      this.radius.set(nav.extras.state['radius'])
    } else {
      this.router.navigate([''])
    }
    
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.ttp.clear(); // stop any ongoing speech
      }
    });
    // window.addEventListener('beforeunload', () => {
    //   this.ttp.clear();
    // });s
  }

  async ngOnInit() {
    this.getImage()
    this.prediction.set(await this.asteroidService.getPrediction(this.lat()!, this.lng()!, this.radius()!, 0) as string)
    this.palabras = this.prediction().split(" ");
    this.mostrarPalabras();
    this.ttp.speak(this.prediction())
  }

  ngOnDestroy(): void {
    this.ttp.clear()
  }

  async getImage() {
    const image_path = await this.asteroidService.getModifiedImage(this.imgId(), 0)
    this.imgPath.set(image_path!);
  }

   private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  mostrarPalabras() {
    const intervalo = setInterval(() => {
    if (this.indice < this.palabras.length) {
      this.palabrasMostradas.push(this.palabras[this.indice]);
      this.indice++;
    } else {
      clearInterval(intervalo);
    }
  }, 100); // medio segundo por palabra
}
}
