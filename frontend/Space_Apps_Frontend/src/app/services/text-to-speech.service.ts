import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {
  speak(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-Es'; // Default language
      utterance.pitch = 1; // Default pitch
      utterance.rate = 1; // Default rate
      window.speechSynthesis.speak(utterance);
    }
  }

  clear() {
    window.speechSynthesis.cancel()
  }
}
