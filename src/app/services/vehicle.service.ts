import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  getVehicles(category?: string): Observable<any[]> {
    const url = category ? `${this.apiUrl}/vehicles?category=${category}` : `${this.apiUrl}/vehicles`;
    return this.http.get<any[]>(url, { headers: this.auth.getHeaders() });
  }

  getVehicleDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vehicles/${id}`);
  }

  addVehicle(vehicleData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/vehicles`, vehicleData, { headers: this.auth.getHeaders() });
  }

  updateVehicle(id: string, vehicleData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/vehicles/${id}`, vehicleData, { headers: this.auth.getHeaders() });
  }

  deleteVehicle(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/vehicles/${id}`, { headers: this.auth.getHeaders() });
  }

  approveVehicle(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/vehicles/${id}/approve`, {}, { headers: this.auth.getHeaders() });
  }
}
