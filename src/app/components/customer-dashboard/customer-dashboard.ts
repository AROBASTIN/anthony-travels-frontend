import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { KycService } from '../../services/kyc.service';
import { TripSummaryComponent, Booking } from '../trip-summary/trip-summary';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, TripSummaryComponent],
  templateUrl: './customer-dashboard.html',
  styleUrl: './customer-dashboard.css'
})
export class CustomerDashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly kycService = inject(KycService);
  private readonly router = inject(Router);

  activeTab = signal<'bookings' | 'history' | 'kyc' | 'profile'>('bookings');
  stats = signal<any>(null);
  bookings = signal<Booking[]>([]);
  
  profileForm!: FormGroup;
  profileSuccess = signal<string>('');
  profileError = signal<string>('');
  
  // Loading indicators
  isLoadingStats = signal<boolean>(true);
  isLoadingBookings = signal<boolean>(true);

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
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.profileForm = this.fb.group({
      name: [user.name, Validators.required],
      email: [{ value: user.email, disabled: true }],
      phone: [user.phone, [Validators.required, Validators.pattern('^[0-9+\\s\\-]{10,15}$')]]
    });

    this.loadStats();
    this.loadBookings();
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

  loadStats() {
    this.isLoadingStats.set(true);
    this.auth.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false)
    });
  }

  loadBookings() {
    this.isLoadingBookings.set(true);
    this.bookingService.getBookings().subscribe({
      next: (data) => {
        this.bookings.set(data);
        this.isLoadingBookings.set(false);
      },
      error: () => this.isLoadingBookings.set(false)
    });
  }

  getActiveBookings(): Booking[] {
    return this.bookings().filter(b => b.status === 'pending' || b.status === 'accepted');
  }

  getPastBookings(): Booking[] {
    return this.bookings().filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected');
  }

  cancelBooking(bookingId: string) {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.updateBookingStatus(bookingId, 'cancelled').subscribe({
        next: () => {
          this.loadBookings();
          this.loadStats();
          alert('Booking cancelled successfully.');
        },
        error: (err) => alert(err.error?.error || 'Failed to cancel booking.')
      });
    }
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

