import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EnquiryPayload {
  full_name: string;
  mobile_number: string;
  email?: string;
  pickup_location: string;
  drop_location?: string;
  journey_date: string;
  journey_time?: string;
  return_date?: string;
  trip_type: 'one_way' | 'round_trip';
  passengers: number;
  bags: number;
  vehicle_type: string;
  ac_required: boolean;
  driver_required: boolean;
  special_requests?: string;
}

@Injectable({ providedIn: 'root' })
export class EnquiryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Submit a new enquiry (no auth required) */
  submitEnquiry(payload: EnquiryPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/enquiries`, payload);
  }

  /** Admin: list all enquiries with optional filter/search */
  getEnquiries(statusFilter?: string, search?: string): Observable<any[]> {
    let params = new HttpParams();
    if (statusFilter) params = params.set('status', statusFilter);
    if (search)       params = params.set('search', search);
    return this.http.get<any[]>(`${this.apiUrl}/enquiries`, { params });
  }

  /** Admin: get single enquiry detail */
  getEnquiry(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/enquiries/${id}`);
  }

  /** Admin: update enquiry status / notes / assignment */
  updateEnquiry(id: string, data: { status?: string; notes?: string; assigned_to?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/enquiries/${id}`, data);
  }
}
