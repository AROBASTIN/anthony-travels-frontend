import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface FuelPrices {
  petrol: number;
  diesel: number;
}

@Injectable({
  providedIn: 'root'
})
export class FuelPriceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/fuel-prices`;

  private readonly _prices = signal<FuelPrices>({
    petrol: 103.44,
    diesel: 89.79
  });

  readonly prices = this._prices.asReadonly();

  constructor() {
    this.fetchLivePrices();
  }

  private fetchLivePrices(): void {
    this.http.get<FuelPrices>(this.apiUrl).subscribe({
      next: (prices) => {
        if (prices && prices.petrol && prices.diesel) {
          this._prices.set(prices);
        }
      },
      error: () => {
        // Fallback silently to mock defaults
      }
    });
  }

  updatePrices(newPrices: Partial<FuelPrices>): void {
    this._prices.update(current => ({
      ...current,
      ...newPrices
    }));
  }
}
