import { CommonModule } from '@angular/common';
import { Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { StarBackground } from '../../components/star-background/star-background';
import { NavigationStart, Router } from '@angular/router';
import { TextToSpeechService } from '../../services/text-to-speech.service';

@Component({
  standalone: true,
  imports: [CommonModule, StarBackground],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss'
})
export class Timeline implements OnInit, OnDestroy {
  private readonly router = inject(Router)
  private readonly ttp = inject(TextToSpeechService)

  public imgb64 = signal('')
  texto = "Tras un año del impacto del meteorito en la región cercana a la ciudad de Moscú, Rusia, los efectos devastadores todavía se hacen sentir en la zona. Gran parte de la ciudad de Moscú ha sufrido daños catastróficos, con edificios colapsados y calles obstruidas por escombros. La población local ha sido gravemente afectada, con un alto número de heridos y fallecidos a causa del impacto. Los recursos de emergencia han estado trabajando incansablemente para tratar de restablecer la normalidad en la región, pero las labores de rescate se han visto obstaculizadas debido a la magnitud de la destrucción. Además, se han presentado problemas de suministro de agua potable y alimentos debido a la interrupción de las infraestructuras básicas. El impacto medioambiental también ha sido significativo, con áreas boscosas cercanas completamente arrasadas y la contaminación del aire y del suelo como consecuencia de la explosión. La fauna local se ha visto gravemente afectada, con muchas especies en peligro de extinción. En cuanto a la situación geopolítica de la región, el impacto del meteorito ha generado tensiones adicionales entre Rusia y los países vecinos. Se han desplegado fuerzas militares para garantizar la seguridad en el área afectada y se han establecido medidas de control fronterizo más estrictas. A pesar de los esfuerzos de reconstrucción en curso, la región de Mos";
  palabras: string[] = [];
  palabrasMostradas: string[] = [];
  indice = 0;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.imgb64.set(nav.extras.state['b64'])
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
    // });
  }

  async ngOnInit() {
    this.palabras = this.texto.split(" ");
    this.mostrarPalabras();
    console.log('adawd')
    this.ttp.speak(this.texto)
  }

  ngOnDestroy(): void {
    this.ttp.clear()
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
