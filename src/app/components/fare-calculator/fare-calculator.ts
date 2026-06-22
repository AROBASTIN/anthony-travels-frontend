import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FuelPriceService } from '../../services/fuel-price';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-fare-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fare-calculator.html',
  styleUrl: './fare-calculator.css'
})
export class FareCalculatorComponent {
  private readonly fuelService = inject(FuelPriceService);
  private readonly auth = inject(AuthService);

  // Expose live fuel prices from service
  readonly fuelPrices = this.fuelService.prices;

  // Slider inputs
  distance = signal<number>(150); // KM
  days = signal<number>(2); // Days
  selectedVehicleType = signal<'hatchback' | 'sedan' | 'suv' | 'crysta' | 'traveller'>('suv');

  readonly pricingConfig = this.auth.pricingConfig;

  readonly activeConfig = computed(() => {
    const config = this.pricingConfig();
    return {
      base_rent: config?.base_rent ?? { hatchback: 1200, sedan: 1600, suv: 2200, crysta: 3200, traveller: 4500 },
      km_rates: config?.km_rates ?? { hatchback: 12, sedan: 14, suv: 16, crysta: 22, traveller: 26 },
      driver_salary: config?.driver_salary ?? 400,
      convenience_fee: config?.convenience_fee ?? 25,
      platform_fee: config?.platform_fee ?? 99,
      gst_percent: config?.gst_percent ?? 5,
      fuel_cost_formula: config?.fuel_cost_formula ?? 1.1,
      toll_multiplier: config?.toll_multiplier ?? 1.0,
      night_charges: config?.night_charges ?? 250,
      festival_charges: config?.festival_charges ?? 300,
      seasonal_pricing: config?.seasonal_pricing ?? 1.15,
      min_booking_amount: config?.min_booking_amount ?? 500
    };
  });

  constructor() {}

  // Rates configuration
  private readonly baseRates = {
    hatchback: { mileage: 16, fuelType: 'petrol' as const },
    sedan: { mileage: 14, fuelType: 'petrol' as const },
    suv: { mileage: 12, fuelType: 'diesel' as const },
    crysta: { mileage: 10, fuelType: 'diesel' as const },
    traveller: { mileage: 8, fuelType: 'diesel' as const }
  };

  // Computations for transparency receipt
  readonly vehicleRent = computed(() => {
    const config = this.activeConfig();
    const type = this.selectedVehicleType();
    const baseVal = config.base_rent[type] || 2000;
    return Math.round(baseVal * this.days() * config.seasonal_pricing);
  });

  readonly driverSalary = computed(() => {
    return this.activeConfig().driver_salary * this.days();
  });

  readonly fuelRequired = computed(() => {
    const rate = this.baseRates[this.selectedVehicleType()];
    return Math.round((this.distance() / rate.mileage) * 10) / 10; // Litres
  });

  readonly fuelCost = computed(() => {
    const config = this.activeConfig();
    const rate = this.baseRates[this.selectedVehicleType()];
    const price = rate.fuelType === 'petrol' ? this.fuelPrices().petrol : this.fuelPrices().diesel;
    return Math.round(this.fuelRequired() * price * config.fuel_cost_formula);
  });

  readonly tollCharges = computed(() => {
    const config = this.activeConfig();
    const baseTolls = Math.round((this.distance() / 100) * 120);
    return Math.round(baseTolls * config.toll_multiplier);
  });

  readonly convenienceFee = computed(() => {
    return this.activeConfig().convenience_fee;
  });

  readonly platformFee = computed(() => {
    return this.activeConfig().platform_fee;
  });

  readonly nightCharges = computed(() => {
    return this.activeConfig().night_charges;
  });

  readonly festivalCharges = computed(() => {
    return this.activeConfig().festival_charges;
  });

  readonly gst = computed(() => {
    const config = this.activeConfig();
    const subtotal = this.vehicleRent() + this.driverSalary() + this.fuelCost() + this.tollCharges() + this.convenienceFee() + this.platformFee() + this.nightCharges() + this.festivalCharges();
    return Math.round(subtotal * (config.gst_percent / 100));
  });

  readonly totalAmount = computed(() => {
    const subtotal = this.vehicleRent() + this.driverSalary() + this.fuelCost() + this.tollCharges() + this.convenienceFee() + this.platformFee() + this.nightCharges() + this.festivalCharges() + this.gst();
    const minAmount = this.activeConfig().min_booking_amount;
    return subtotal < minAmount ? minAmount : subtotal;
  });
}
