import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  getBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings`, { headers: this.auth.getHeaders() });
  }

  createBooking(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings`, bookingData, { headers: this.auth.getHeaders() });
  }

  updateBookingStatus(bookingId: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/status`, { status }, { headers: this.auth.getHeaders() });
  }

  processPayment(paymentData: { booking_id: string; amount: number; payment_method: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/checkout`, paymentData, { headers: this.auth.getHeaders() });
  }

  updateBookingDetails(bookingId: string, bookingData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/bookings/${bookingId}`, bookingData, { headers: this.auth.getHeaders() });
  }
}
