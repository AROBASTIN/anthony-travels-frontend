import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Review {
  name: string;
  tripType: string;
  rating: number;
  comment: string;
  location: string;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css'
})
export class ReviewsComponent {
  reviews: Review[] = [
    {
      name: 'Ananya Ramachandran',
      tripType: 'Pilgrimage Tour (Chennai to Madurai - Rameswaram)',
      rating: 5,
      comment: 'Booked a Toyota Innova Crysta for our family pilgrimage. The vehicle was exceptionally clean. Driver Suresh drove carefully through the ghat sections and knew the best traditional temples and rest stops in Madurai and Rameshwaram. Splendid experience!',
      location: 'Chennai'
    },
    {
      name: 'Rohan Krishnakumar',
      tripType: 'Weekend Getaway (Coimbatore to Ooty Hills)',
      rating: 5,
      comment: 'Extremely punctual service. Received driver details hours before pickup. Suresh arrived early at 5:00 AM, making the hill climb towards Ooty completely stress-free. Very safe driving in heavy mist. Highly recommended travels!',
      location: 'Coimbatore'
    },
    {
      name: 'Meera Govindarajan',
      tripType: 'Solo Travel (Chennai to Mahabalipuram)',
      rating: 5,
      comment: 'As a solo female traveler, safety is my primary concern. The live GPS tracking link shared with my family and the extremely professional conduct of driver Anand made me feel fully secure. Will definitely book again for my next TN temple tour.',
      location: 'Chennai'
    }
  ];
}

