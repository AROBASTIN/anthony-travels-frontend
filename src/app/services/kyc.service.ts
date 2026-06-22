import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class KycService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8000/api';

  getKycStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/kyc/status`, { headers: this.auth.getHeaders() });
  }

  uploadKycDocument(file: File, docType: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    
    // We do NOT set Content-Type header to allow browser to automatically boundary set it
    const token = this.auth.getAccessToken();
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.http.post<any>(`${this.apiUrl}/kyc/upload`, formData, { headers });
  }

  getKycRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/kyc/requests`, { headers: this.auth.getHeaders() });
  }

  processKycRequest(requestId: string, payload: { action: 'approve' | 'reject' | 'request_reupload'; notes?: string; doc_types?: string[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/kyc/requests/${requestId}/action`, payload, { headers: this.auth.getHeaders() });
  }
}
