import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { DriverService } from '../../services/driver.service';
import { KycService } from '../../services/kyc.service';
import { TripSummaryComponent, Booking } from '../trip-summary/trip-summary';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, TripSummaryComponent],
  templateUrl: './driver-dashboard.html',
  styleUrl: './driver-dashboard.css'
})
export class DriverDashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly driverService = inject(DriverService);
  private readonly kycService = inject(KycService);
  private readonly router = inject(Router);

  activeTab = signal<'trips' | 'documents' | 'profile'>('trips');
  stats = signal<any>(null);
  bookings = signal<Booking[]>([]);
  driverProfile = signal<any>(null);
  
  profileForm!: FormGroup;
  profileSuccess = signal<string>('');
  profileError = signal<string>('');
  
  isLoading = signal<boolean>(true);

  // KYC States
  kycStatus = signal<string>('None');
  kycDocs = signal<any[]>([]);
  selectedFiles: { [key: string]: File } = {};
  previews: { [key: string]: string } = {};
  kycMessage = signal<string>('');
  kycError = signal<string>('');
  isUploading = signal<boolean>(false);

  getSelectedFilesCount(): number {
    return Object.keys(this.selectedFiles).length;
  }

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user || user.role !== 'driver') {
      this.router.navigate(['/login']);
      return;
    }

    this.profileForm = this.fb.group({
      name: [user.name, Validators.required],
      email: [{ value: user.email, disabled: true }],
      phone: [user.phone, [Validators.required, Validators.pattern('^[0-9+\\s\\-]{10,15}$')]]
    });

    this.loadDriverData();
    this.loadKycStatus();
  }

  loadKycStatus() {
    this.kycService.getKycStatus().subscribe({
      next: (res) => {
        this.kycStatus.set(res.kyc_status);
        this.kycDocs.set(res.documents);
        
        // Populate previews with uploaded URLs (creating a new reference)
        const newPreviews: { [key: string]: string } = {};
        res.documents.forEach((d: any) => {
          newPreviews[d.doc_type] = d.file_url;
        });
        this.previews = newPreviews;
      }
    });
  }

  getDocStatus(docType: string): string {
    const doc = this.kycDocs().find(d => d.doc_type === docType);
    return doc ? doc.status : 'missing';
  }

  onFileSelected(event: any, docType: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[docType] = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Reassign previews reference to trigger Angular change detection
        this.previews = { ...this.previews, [docType]: e.target.result };
      };
      reader.readAsDataURL(file);
    }
  }

  uploadKyc() {
    const filesToUpload = Object.keys(this.selectedFiles);
    if (filesToUpload.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    this.isUploading.set(true);
    this.kycMessage.set('Uploading files...');
    this.kycError.set('');
    
    let uploadedCount = 0;
    const totalToUpload = filesToUpload.length;

    filesToUpload.forEach(docType => {
      const file = this.selectedFiles[docType];
      this.kycService.uploadKycDocument(file, docType).subscribe({
        next: (res) => {
          uploadedCount++;
          delete this.selectedFiles[docType];
          if (uploadedCount === totalToUpload) {
            this.kycMessage.set('Documents uploaded successfully! Reviewing status...');
            this.isUploading.set(false);
            this.loadKycStatus();
            this.loadDriverData();
          }
        },
        error: (err) => {
          this.kycError.set(err.error?.error || `Failed to upload ${docType}.`);
          this.kycMessage.set('');
          this.isUploading.set(false);
        }
      });
    });
  }

  loadDriverData() {
    this.isLoading.set(true);
    this.auth.getDashboardStats().subscribe({
      next: (statsData) => {
        this.stats.set(statsData);
      }
    });

    this.driverService.getDrivers().subscribe({
      next: (drivers) => {
        const myDetails = drivers.find(d => d.user_id === this.auth.currentUser()?.id);
        if (myDetails) {
          this.driverProfile.set(myDetails);
        }
      }
    });

    this.bookingService.getBookings().subscribe({
      next: (bookingsData) => {
        this.bookings.set(bookingsData);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getPendingTrips(): Booking[] {
    return this.bookings().filter(b => b.status === 'pending');
  }

  getAcceptedTrips(): Booking[] {
    return this.bookings().filter(b => b.status === 'accepted');
  }

  getPastTrips(): Booking[] {
    return this.bookings().filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected');
  }

  acceptTrip(bookingId: string) {
    this.bookingService.updateBookingStatus(bookingId, 'accepted').subscribe({
      next: () => {
        this.loadDriverData();
        alert('Trip accepted! Go to the pickup location.');
      },
      error: (err) => alert(err.error?.error || 'Failed to accept trip.')
    });
  }

  rejectTrip(bookingId: string) {
    this.bookingService.updateBookingStatus(bookingId, 'rejected').subscribe({
      next: () => {
        this.loadDriverData();
        alert('Trip rejected.');
      },
      error: (err) => alert(err.error?.error || 'Failed to reject trip.')
    });
  }

  completeTrip(bookingId: string) {
    this.bookingService.updateBookingStatus(bookingId, 'completed').subscribe({
      next: () => {
        this.loadDriverData();
        alert('Trip completed successfully. Earning recorded.');
      },
      error: (err) => alert(err.error?.error || 'Failed to complete trip.')
    });
  }

  onUpdateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileSuccess.set('');
    this.profileError.set('');

    this.auth.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.profileSuccess.set('Profile updated successfully!');
        const currentUser = this.auth.currentUser();
        if (currentUser) {
          const updated = { ...currentUser, ...this.profileForm.value };
          localStorage.setItem('user', JSON.stringify(updated));
          this.auth.currentUser.set(updated);
        }
      },
      error: (err) => {
        this.profileError.set(err.error?.error || 'Failed to update profile.');
      }
    });
  }

  logout() {
    this.auth.logout();
  }
}

