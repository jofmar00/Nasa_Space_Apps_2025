import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'star-background',
  imports: [CommonModule],
  templateUrl: './star-background.html',
  styleUrl: './star-background.scss'
})
export class StarBackground implements OnInit {
  stars: Array<{ left: number; top: number; animationDelay: number; size: number }> = [];

  ngOnInit() {
    this.generateStars();
  }

  private generateStars() {
    const numberOfStars = 100;

    for (let i = 0; i < numberOfStars; i++) {
      this.stars.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 4,
        size: Math.random() * 3 + 1
      });
    }
  }
}
