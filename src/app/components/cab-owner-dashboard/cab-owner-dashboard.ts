import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { VehicleService } from '../../services/vehicle.service';
import { DriverService } from '../../services/driver.service';
import { KycService } from '../../services/kyc.service';
import { TripSummaryComponent, Booking } from '../trip-summary/trip-summary';

@Component({
  selector: 'app-cab-owner-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, TripSummaryComponent],
  templateUrl: './cab-owner-dashboard.html',
  styleUrl: './cab-owner-dashboard.css'
})
export class CabOwnerDashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly vehicleService = inject(VehicleService);
  private readonly driverService = inject(DriverService);
  private readonly kycService = inject(KycService);
  private readonly router = inject(Router);

  activeTab = signal<'fleet' | 'bookings' | 'drivers' | 'kyc' | 'profile'>('fleet');
  stats = signal<any>(null);
  bookings = signal<Booking[]>([]);
  vehicles = signal<any[]>([]);
  drivers = signal<any[]>([]);

  vehicleForm!: FormGroup;
  profileForm!: FormGroup;
  
  isAddingVehicle = signal<boolean>(false);
  editingVehicleId = signal<string | null>(null);

  profileSuccess = signal<string>('');
  profileError = signal<string>('');
  vehicleSuccess = signal<string>('');
  vehicleError = signal<string>('');

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

  vehicleCategories = [
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'crysta', label: 'Innova Crysta' },
    { value: 'traveller', label: 'Tempo Traveller' },
    { value: 'minibus', label: 'Mini Bus' },
    { value: 'luxury', label: 'Luxury Cars' }
  ];

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user || user.role !== 'cab_owner') {
      this.router.navigate(['/login']);
      return;
    }

    this.profileForm = this.fb.group({
      name: [user.name, Validators.required],
      email: [{ value: user.email, disabled: true }],
      phone: [user.phone, [Validators.required, Validators.pattern('^[0-9+\\s\\-]{10,15}$')]]
    });

    this.initVehicleForm();
    this.loadAllData();
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
            this.loadAllData();
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

  initVehicleForm() {
    this.vehicleForm = this.fb.group({
      name: ['', Validators.required],
      category: ['suv', Validators.required],
      plate_number: ['', [Validators.required, Validators.pattern('^[A-Z]{2}-[0-9]{2}-[A-Z]{2}-[0-9]{4}$')]],
      seats: [4, [Validators.required, Validators.min(2)]],
      price_per_km: [12, [Validators.required, Validators.min(5)]],
      fuel: ['Diesel', Validators.required],
      ac: [true],
      driver_available: [true]
    });
  }

  loadAllData() {
    this.isLoading.set(true);
    
    this.auth.getDashboardStats().subscribe({
      next: (s) => this.stats.set(s)
    });

    this.vehicleService.getVehicles().subscribe({
      next: (vList) => {
        this.vehicles.set(vList.filter(v => v.owner_id === this.auth.currentUser()?.id));
      }
    });

    this.driverService.getDrivers().subscribe({
      next: (dList) => this.drivers.set(dList)
    });

    this.bookingService.getBookings().subscribe({
      next: (bList) => {
        this.bookings.set(bList);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSaveVehicle() {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    this.vehicleSuccess.set('');
    this.vehicleError.set('');

    const payload = this.vehicleForm.value;

    if (this.editingVehicleId()) {
      this.vehicleService.updateVehicle(this.editingVehicleId()!, payload).subscribe({
        next: () => {
          this.vehicleSuccess.set('Vehicle updated successfully!');
          this.loadAllData();
          this.closeVehicleForm();
        },
        error: (err) => this.vehicleError.set(err.error?.error || 'Failed to update vehicle.')
      });
    } else {
      this.vehicleService.addVehicle(payload).subscribe({
        next: () => {
          this.vehicleSuccess.set('Vehicle added successfully!');
          this.loadAllData();
          this.closeVehicleForm();
        },
        error: (err) => this.vehicleError.set(err.error?.error || 'Failed to add vehicle.')
      });
    }
  }

  editVehicle(vehicle: any) {
    this.editingVehicleId.set(vehicle.id);
    this.vehicleForm.patchValue({
      name: vehicle.name,
      category: vehicle.category,
      plate_number: vehicle.plate_number,
      seats: vehicle.seats,
      price_per_km: vehicle.price_per_km,
      fuel: vehicle.fuel,
      ac: vehicle.ac,
      driver_available: vehicle.driver_available
    });
    this.isAddingVehicle.set(true);
  }

  deleteVehicle(vehicleId: string) {
    if (confirm('Are you sure you want to delete this vehicle from your fleet?')) {
      this.vehicleService.deleteVehicle(vehicleId).subscribe({
        next: () => {
          this.loadAllData();
          alert('Vehicle removed successfully.');
        },
        error: (err) => alert(err.error?.error || 'Failed to delete vehicle.')
      });
    }
  }

  closeVehicleForm() {
    this.isAddingVehicle.set(false);
    this.editingVehicleId.set(null);
    this.vehicleForm.reset({
      category: 'suv',
      seats: 4,
      price_per_km: 12,
      fuel: 'Diesel',
      ac: true,
      driver_available: true
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

