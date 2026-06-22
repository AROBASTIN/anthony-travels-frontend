import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { DriverService } from '../../services/driver.service';

import { FuelPriceService } from '../../services/fuel-price';

export interface TripSummary {
  vehicle: string;
  distance: number;
  vehicleRent: number;
  driverCost: number;
  fuelCost: number;
  tollCharges: number;
  convenienceFee: number;
  platformFee: number;
  nightSurcharge: number;
  festivalSurcharge: number;
  gst: number;
  finalAmount: number;
}

export interface DriverInfo {
  name: string;
  experience: number;
  languages: string[];
  rating: number;
  verified: boolean;
}

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './booking-form.html',
  styleUrl: './booking-form.css'
})
export class BookingFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly driverService = inject(DriverService);
  private readonly fuelService = inject(FuelPriceService);
  private readonly router = inject(Router);

  bookingForm!: FormGroup;
  activeTab = signal<'outstation' | 'local' | 'airport'>('outstation');
  showSummaryModal = signal(false);
  
  // Computed values
  tripSummary = signal<TripSummary | null>(null);
  driverInfo = signal<DriverInfo | null>(null);

  vehicleCategories = [
    { value: 'hatchback', label: 'Hatchback (WagonR/Tiago)' },
    { value: 'sedan', label: 'Sedan (Dzire/Etios)' },
    { value: 'suv', label: 'SUV (Ertiga/Carens)' },
    { value: 'crysta', label: 'Innova Crysta (Premium)' },
    { value: 'traveller', label: 'Tempo Traveller (12-16 Seater)' },
    { value: 'minibus', label: 'Mini Bus (21+ Seater)' },
    { value: 'luxury', label: 'Luxury Cars (Mercedes/BMW)' }
  ];

  private readonly vehicleSpecs: { [key: string]: { mileage: number, fuelType: 'petrol' | 'diesel' } } = {
    hatchback: { mileage: 16, fuelType: 'petrol' },
    sedan: { mileage: 14, fuelType: 'petrol' },
    suv: { mileage: 12, fuelType: 'diesel' },
    crysta: { mileage: 10, fuelType: 'diesel' },
    traveller: { mileage: 8, fuelType: 'diesel' },
    minibus: { mileage: 7, fuelType: 'diesel' },
    luxury: { mileage: 6, fuelType: 'diesel' }
  };

  getDefaultBaseRent(type: string): number {
    const rates: any = { hatchback: 1200, sedan: 1600, suv: 2200, crysta: 3200, traveller: 4500, minibus: 6500, luxury: 10000 };
    return rates[type] || 2000;
  }

  getDefaultKmRate(type: string): number {
    const rates: any = { hatchback: 12, sedan: 14, suv: 16, crysta: 22, traveller: 26, minibus: 35, luxury: 50 };
    return rates[type] || 15;
  }

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.bookingForm = this.fb.group({
      pickupLocation: ['', Validators.required],
      dropLocation: ['', Validators.required],
      pickupDate: [today, Validators.required],
      pickupTime: ['09:00', Validators.required],
      dropDate: [today, Validators.required],
      dropTime: ['21:00', Validators.required],
      vehicleType: ['suv', Validators.required],
      driverRequired: [true],
      passengersCount: [1, [Validators.required, Validators.min(1), Validators.max(30)]]
    });
  }

  setTab(tab: 'outstation' | 'local' | 'airport') {
    this.activeTab.set(tab);
    if (tab === 'local') {
      this.bookingForm.get('dropLocation')?.clearValidators();
    } else {
      this.bookingForm.get('dropLocation')?.setValidators([Validators.required]);
    }
    this.bookingForm.get('dropLocation')?.updateValueAndValidity();
  }

  adjustPassengers(amount: number) {
    const current = this.bookingForm.get('passengersCount')?.value || 1;
    const next = current + amount;
    if (next >= 1 && next <= 30) {
      this.bookingForm.get('passengersCount')?.setValue(next);
    }
  }

  onSubmit() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    const formVal = this.bookingForm.value;
    
    // Dynamic outstation calculation using config
    const randomDistance = Math.floor(Math.random() * 200) + 80; // KM
    
    const start = new Date(formVal.pickupDate);
    const end = new Date(formVal.dropDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const pricing = this.auth.pricingConfig();
    const baseRentRate = pricing?.base_rent?.[formVal.vehicleType] ?? this.getDefaultBaseRent(formVal.vehicleType);
    const kmRate = pricing?.km_rates?.[formVal.vehicleType] ?? this.getDefaultKmRate(formVal.vehicleType);
    const driverBataRate = pricing?.driver_salary ?? 400;
    const platformFee = pricing?.platform_fee ?? 99;
    const convenienceFee = pricing?.convenience_fee ?? 25;
    const gstPercent = pricing?.gst_percent ?? 5;
    const fuelCostFormula = pricing?.fuel_cost_formula ?? 1.1;
    const tollMultiplier = pricing?.toll_multiplier ?? 1.0;
    const nightChargesRate = pricing?.night_charges ?? 250;
    const festivalChargesRate = pricing?.festival_charges ?? 300;
    const seasonalMultiplier = pricing?.seasonal_pricing ?? 1.15;
    const minBookingAmount = pricing?.min_booking_amount ?? 500;

    let rent = Math.round(baseRentRate * days * seasonalMultiplier);
    const driverCost = formVal.driverRequired ? (driverBataRate * days) : 0;
    
    const spec = this.vehicleSpecs[formVal.vehicleType] || { mileage: 12, fuelType: 'diesel' };
    const fuelPrice = spec.fuelType === 'petrol' ? this.fuelService.prices().petrol : this.fuelService.prices().diesel;
    const fuelCost = Math.round(((randomDistance / spec.mileage) * fuelPrice) * fuelCostFormula);
    
    const tolls = Math.round(180 * tollMultiplier);
    
    let nightSurcharge = 0;
    if (formVal.pickupTime) {
      const hour = parseInt(formVal.pickupTime.split(':')[0]);
      if (hour >= 22 || hour < 6) {
        nightSurcharge = nightChargesRate;
      }
    }
    
    const festivalSurcharge = festivalChargesRate;

    const subtotal = rent + driverCost + fuelCost + tolls + convenienceFee + platformFee + nightSurcharge + festivalSurcharge;
    let gst = Math.round(subtotal * (gstPercent / 100));
    let finalAmount = subtotal + gst;

    if (finalAmount < minBookingAmount) {
      const diff = minBookingAmount - finalAmount;
      rent += diff;
      finalAmount = minBookingAmount;
    }

    this.tripSummary.set({
      vehicle: this.vehicleCategories.find(c => c.value === formVal.vehicleType)?.label || 'SUV',
      distance: randomDistance,
      vehicleRent: rent,
      driverCost: driverCost,
      fuelCost: fuelCost,
      tollCharges: tolls,
      convenienceFee: convenienceFee,
      platformFee: platformFee,
      nightSurcharge: nightSurcharge,
      festivalSurcharge: festivalSurcharge,
      gst: gst,
      finalAmount: finalAmount
    });

    if (formVal.driverRequired) {
      this.driverService.getDrivers().subscribe({
        next: (drivers) => {
          const available = drivers.find(d => d.status === 'available');
          if (available) {
            this.driverInfo.set({
              name: available.name,
              experience: available.experience,
              languages: available.languages,
              rating: available.rating || 5.0,
              verified: available.verified
            });
          } else {
            this.driverInfo.set({
              name: 'No driver currently available',
              experience: 0,
              languages: [],
              rating: 5.0,
              verified: false
            });
          }
          this.showSummaryModal.set(true);
        },
        error: () => {
          this.driverInfo.set(null);
          this.showSummaryModal.set(true);
        }
      });
    } else {
      this.driverInfo.set(null);
      this.showSummaryModal.set(true);
    }
  }

  closeModal() {
    this.showSummaryModal.set(false);
  }

  confirmBooking() {
    if (!this.auth.isLoggedIn()) {
      alert('Please login/register to request a booking.');
      this.closeModal();
      this.router.navigate(['/login']);
      return;
    }

    const formVal = this.bookingForm.value;
    const summary = this.tripSummary();

    const payload = {
      pickupLocation: formVal.pickupLocation,
      dropLocation: formVal.dropLocation,
      pickupDate: formVal.pickupDate,
      pickupTime: formVal.pickupTime,
      dropDate: formVal.dropDate,
      dropTime: formVal.dropTime,
      vehicleType: this.vehicleCategories.find(c => c.value === formVal.vehicleType)?.label || 'SUV',
      passengersCount: formVal.passengersCount,
      driverRequired: formVal.driverRequired,
      fareDetails: summary
    };

    this.bookingService.createBooking(payload).subscribe({
      next: (res) => {
        alert(`Booking Confirmed! Assigned Driver: ${res.assigned_driver || 'Self-Drive/Assigning...'}`);
        this.closeModal();
        this.router.navigate(['/dashboard/customer']);
        this.bookingForm.reset({
          pickupDate: new Date().toISOString().split('T')[0],
          pickupTime: '09:00',
          dropDate: new Date().toISOString().split('T')[0],
          dropTime: '21:00',
          vehicleType: 'suv',
          driverRequired: true,
          passengersCount: 1
        });
      },
      error: (err) => {
        alert(err.error?.error || 'Booking request failed. Please try again.');
      }
    });
  }
}
