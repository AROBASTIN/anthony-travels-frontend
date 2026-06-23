import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'driver' | 'cab_owner' | 'admin';
  phone: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  readonly currentUser = signal<User | null>(null);
  readonly websiteContent = signal<any>(null);
  readonly pricingConfig = signal<any>(null);

  constructor() {
    this.loadUserFromStorage();
    this.loadWebsiteContent();
    this.loadPricingConfig();
  }

  loadPricingConfig() {
    this.getPricingConfig().subscribe({
      next: (config) => {
        if (config) {
          this.pricingConfig.set(config);
        }
      }
    });
  }

  loadWebsiteContent() {
    this.getWebsiteContent().subscribe({
      next: (content) => {
        if (content) {
          this.websiteContent.set(content);
        }
      }
    });
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        this.currentUser.set(JSON.parse(userStr));
      } catch (e) {
        this.logout();
      }
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getHeaders(): any {
    // Kept for backward compatibility with older services
    // The auth interceptor automatically injects the Bearer token.
    return { 'Content-Type': 'application/json' };
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  login(credentials: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('refresh_token', res.refresh_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  refreshToken(): Observable<any> {
    const refresh_token = this.getRefreshToken();
    return this.http.post(`${this.apiUrl}/auth/refresh`, { refresh_token }).pipe(
      tap((res: any) => {
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('refresh_token', res.refresh_token);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`);
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/profile`, profileData);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboards/stats`);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user ? user.role === role : false;
  }

  // --- Admin pricing & content ---
  getPricingConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/pricing`);
  }

  updatePricingConfig(config: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/pricing`, config).pipe(
      tap(() => {
        // Reload from server to get the canonical saved values
        this.loadPricingConfig();
      })
    );
  }

  getWebsiteContent(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/content`);
  }

  updateWebsiteContent(content: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/content`, content).pipe(
      tap(() => {
        // Immediately update the signal so footer/components reflect new data
        this.websiteContent.set(content);
        // Also reload from server to ensure canonical state
        this.loadWebsiteContent();
      })
    );
  }

  // --- Admin user management ---
  getAdminUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`);
  }

  updateAdminUser(userId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}`, data);
  }

  deleteAdminUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`);
  }
}
