import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8000/api';

  getDrivers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/drivers`, { headers: this.auth.getHeaders() });
  }

  updateDriverDocument(driverId: string, docData: { doc_type: 'license' | 'aadhar'; status: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/drivers/${driverId}/documents`, docData, { headers: this.auth.getHeaders() });
  }

  addDriver(driverData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/drivers`, driverData, { headers: this.auth.getHeaders() });
  }

  updateDriver(driverId: string, driverData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/drivers/${driverId}`, driverData, { headers: this.auth.getHeaders() });
  }

  deleteDriver(driverId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/drivers/${driverId}`, { headers: this.auth.getHeaders() });
  }
}
