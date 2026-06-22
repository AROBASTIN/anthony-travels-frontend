import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingFormComponent } from '../booking-form/booking-form';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, BookingFormComponent],
  templateUrl: './hero.html',
  styleUrl: './hero.css'
})
export class HeroComponent {
  readonly auth = inject(AuthService);
}
