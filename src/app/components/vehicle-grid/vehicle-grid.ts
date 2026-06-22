import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService } from '../../services/vehicle.service';

export interface Vehicle {
  name: string;
  category: string;
  image?: string;
  ac: boolean;
  fuel: string;
  seats: number;
  driverAvailable: boolean;
  pricePerKm: number;
  rating: number;
  reviews: number;
}

@Component({
  selector: 'app-vehicle-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-grid.html',
  styleUrl: './vehicle-grid.css'
})
export class VehicleGridComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  vehicles: any[] = [];

  ngOnInit(): void {
    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        // Map category to image name if not explicitly set
        this.vehicles = data.map(v => ({
          ...v,
          image: v.image || v.category
        }));
      }
    });
  }

  selectVehicle(vehicleName: string) {
    const element = document.getElementById('hero');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
