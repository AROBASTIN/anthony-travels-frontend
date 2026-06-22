import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Driver {
  name: string;
  experience: number;
  languages: string[];
  rating: number;
  verified: boolean;
  status: 'available' | 'busy';
}

@Component({
  selector: 'app-driver-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-card.html',
  styleUrl: './driver-card.css'
})
export class DriverCardComponent {
  @Input() driver!: Driver;
}
