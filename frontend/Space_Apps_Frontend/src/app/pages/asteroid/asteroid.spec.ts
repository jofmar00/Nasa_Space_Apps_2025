import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Asteroid } from './asteroid';

describe('Asteroid', () => {
  let component: Asteroid;
  let fixture: ComponentFixture<Asteroid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Asteroid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Asteroid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
