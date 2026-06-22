import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TripFare {
  vehicleRent?: number;
  rent?: number;
  driverSalary?: number;
  driverCost?: number;
  distance: number;
  fuelRequired?: number;
  fuelCost: number;
  tollCharges: number;
  platformFee?: number;
  gst: number;
  totalAmount?: number;
  finalAmount?: number;
}

export interface Booking {
  id?: string;
  customer_name?: string;
  pickupLocation: string;
  dropLocation?: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  vehicleType: string;
  passengersCount: number;
  driverRequired: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  driver_id?: string;
  driver_name?: string;
  fareDetails?: TripFare;
}

@Component({
  selector: 'app-trip-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-summary.html',
  styleUrl: './trip-summary.css'
})
export class TripSummaryComponent {
  @Input() booking!: Booking;
}
