import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { VehicleService } from '../../services/vehicle.service';
import { DriverService } from '../../services/driver.service';
import { KycService } from '../../services/kyc.service';
import { EnquiryService } from '../../services/enquiry.service';
import { TripSummaryComponent, Booking } from '../trip-summary/trip-summary';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly vehicleService = inject(VehicleService);
  private readonly driverService = inject(DriverService);
  private readonly kycService = inject(KycService);
  private readonly enquiryService = inject(EnquiryService);
  private readonly router = inject(Router);

  activeTab = signal<'analytics' | 'pricing' | 'bookings' | 'drivers' | 'vehicles' | 'users' | 'content' | 'profile' | 'kyc' | 'enquiries'>('analytics');
  
  stats = signal<any>(null);
  bookings = signal<Booking[]>([]);
  vehicles = signal<any[]>([]);
  drivers = signal<any[]>([]);
  usersList = signal<any[]>([]);

  // Action states
  isEditingDriver = signal<boolean>(false);
  editingDriverId = signal<string | null>(null);
  
  isEditingUser = signal<boolean>(false);
  editingUserId = signal<string | null>(null);
  
  isEditingBooking = signal<boolean>(false);
  editingBookingId = signal<string | null>(null);

  isEditingVehicle = signal<boolean>(false);
  editingVehicleId = signal<string | null>(null);

  // Forms
  pricingForm!: FormGroup;
  contentForm!: FormGroup;
  driverForm!: FormGroup;
  userForm!: FormGroup;
  bookingForm!: FormGroup;
  vehicleForm!: FormGroup;
  profileForm!: FormGroup;

  // Alerts
  profileSuccess = signal<string>('');
  profileError = signal<string>('');
  pricingSuccess = signal<string>('');
  pricingError = signal<string>('');
  contentSuccess = signal<string>('');
  contentError = signal<string>('');
  driverSuccess = signal<string>('');
  driverError = signal<string>('');
  userSuccess = signal<string>('');
  userError = signal<string>('');
  bookingSuccess = signal<string>('');
  bookingError = signal<string>('');
  vehicleSuccess = signal<string>('');
  vehicleError = signal<string>('');

  isLoading = signal<boolean>(true);

  // KYC Management Signals
  kycRequests = signal<any[]>([]);
  showKycModal = signal<boolean>(false);
  selectedRequestForAction = signal<any>(null);
  kycActionType = signal<'reject' | 'reupload'>('reject');
  kycActionNotes = signal<string>('');
  reuploadDocTypes: { [key: string]: boolean } = {
    profile_picture: false,
    aadhar_front: false,
    aadhar_back: false,
    license_front: false,
    license_back: false,
    pan_card: false,
    rc_book: false,
    insurance: false
  };
  kycSuccess = signal<string>('');
  kycError = signal<string>('');

  // Enquiry Management
  enquiries = signal<any[]>([]);
  enquiryStatusFilter = signal<string>('');
  enquirySearch = signal<string>('');
  selectedEnquiry = signal<any>(null);
  enquiryNotes = signal<string>('');
  enquiryAssignTo = signal<string>('');
  enquirySuccess = signal<string>('');
  enquiryError = signal<string>('');
  showEnquiryDetail = signal<boolean>(false);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user || user.role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }

    this.profileForm = this.fb.group({
      name: [user.name, Validators.required],
      email: [{ value: user.email, disabled: true }],
      phone: [user.phone, [Validators.required, Validators.pattern('^[0-9+\\s\\-]{10,15}$')]]
    });

    this.initForms();
    this.loadAdminData();
    this.loadPricing();
    this.loadContent();
  }

  initForms() {
    // Pricing Form
    this.pricingForm = this.fb.group({
      hatchback_base: [1200, Validators.required],
      sedan_base: [1600, Validators.required],
      suv_base: [2200, Validators.required],
      crysta_base: [3200, Validators.required],
      traveller_base: [4500, Validators.required],
      minibus_base: [6500, Validators.required],
      luxury_base: [10000, Validators.required],

      hatchback_rate: [12, Validators.required],
      sedan_rate: [14, Validators.required],
      suv_rate: [16, Validators.required],
      crysta_rate: [22, Validators.required],
      traveller_rate: [26, Validators.required],
      minibus_rate: [35, Validators.required],
      luxury_rate: [50, Validators.required],

      driver_salary: [400, Validators.required],
      convenience_fee: [25, Validators.required],
      platform_fee: [99, Validators.required],
      gst_percent: [5, Validators.required],
      fuel_cost_formula: [1.1, Validators.required],
      toll_multiplier: [1.0, Validators.required],
      night_charges: [250, Validators.required],
      festival_charges: [300, Validators.required],
      seasonal_pricing: [1.15, Validators.required],
      min_booking_amount: [500, Validators.required],
      offers_enabled: [true]
    });

    // Content Form
    this.contentForm = this.fb.group({
      hero_title: ['', Validators.required],
      hero_subtitle: ['', Validators.required],
      company_info: ['', Validators.required],
      contact_phone: ['', Validators.required],
      contact_email: ['', [Validators.required, Validators.email]],
      contact_address: ['', Validators.required]
    });

    // Driver Form
    this.driverForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9+\\s\\-]{10,15}$')]],
      experience: [2, [Validators.required, Validators.min(0)]],
      languages: ['Hindi, English', Validators.required],
      status: ['available', Validators.required],
      verified: [true]
    });

    // User Form
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9+\\s\\-]{10,15}$')]],
      role: ['customer', Validators.required],
      status: ['active', Validators.required]
    });

    // Booking Form
    this.bookingForm = this.fb.group({
      pickupLocation: ['', Validators.required],
      dropLocation: [''],
      pickupDate: ['', Validators.required],
      pickupTime: ['', Validators.required],
      dropDate: ['', Validators.required],
      dropTime: ['', Validators.required],
      vehicleType: ['', Validators.required],
      passengersCount: [1, Validators.required],
      driverRequired: [true],
      status: ['pending', Validators.required],
      driver_id: [''],
      driver_name: [''],
      finalAmount: [0, Validators.required]
    });

    // Vehicle Form
    this.vehicleForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      plate_number: ['', Validators.required],
      seats: [4, Validators.required],
      price_per_km: [12, Validators.required],
      fuel: ['Diesel', Validators.required],
      ac: [true],
      driver_available: [true],
      status: ['available', Validators.required],
      approved: [true]
    });
  }

  loadAdminData() {
    this.isLoading.set(true);

    this.auth.getDashboardStats().subscribe({ next: (s) => this.stats.set(s) });
    this.bookingService.getBookings().subscribe({ next: (bList) => this.bookings.set(bList) });
    this.vehicleService.getVehicles().subscribe({ next: (vList) => this.vehicles.set(vList) });
    
    // KYC Requests
    this.loadKycRequests();
    // Enquiries
    this.loadEnquiries();
    
    // Drivers List
    this.driverService.getDrivers().subscribe({
      next: (dList) => {
        this.drivers.set(dList);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    // Users List
    this.auth.getAdminUsers().subscribe({
      next: (uList) => this.usersList.set(uList)
    });
  }

  loadPricing() {
    this.auth.getPricingConfig().subscribe({
      next: (config) => {
        if (config) {
          this.pricingForm.patchValue({
            hatchback_base: config.base_rent?.hatchback ?? 1200,
            sedan_base: config.base_rent?.sedan ?? 1600,
            suv_base: config.base_rent?.suv ?? 2200,
            crysta_base: config.base_rent?.crysta ?? 3200,
            traveller_base: config.base_rent?.traveller ?? 4500,
            minibus_base: config.base_rent?.minibus ?? 6500,
            luxury_base: config.base_rent?.luxury ?? 10000,

            hatchback_rate: config.km_rates?.hatchback ?? 12,
            sedan_rate: config.km_rates?.sedan ?? 14,
            suv_rate: config.km_rates?.suv ?? 16,
            crysta_rate: config.km_rates?.crysta ?? 22,
            traveller_rate: config.km_rates?.traveller ?? 26,
            minibus_rate: config.km_rates?.minibus ?? 35,
            luxury_rate: config.km_rates?.luxury ?? 50,

            driver_salary: config.driver_salary ?? 400,
            convenience_fee: config.convenience_fee ?? 25,
            platform_fee: config.platform_fee ?? 99,
            gst_percent: config.gst_percent ?? 5,
            fuel_cost_formula: config.fuel_cost_formula ?? 1.1,
            toll_multiplier: config.toll_multiplier ?? 1.0,
            night_charges: config.night_charges ?? 250,
            festival_charges: config.festival_charges ?? 300,
            seasonal_pricing: config.seasonal_pricing ?? 1.15,
            min_booking_amount: config.min_booking_amount ?? 500,
            offers_enabled: config.offers_enabled !== false
          });
        }
      }
    });
  }

  loadContent() {
    this.auth.getWebsiteContent().subscribe({
      next: (content) => {
        if (content) {
          this.contentForm.patchValue({
            hero_title: content.hero_title,
            hero_subtitle: content.hero_subtitle,
            company_info: content.company_info,
            contact_phone: content.contact_phone,
            contact_email: content.contact_email,
            contact_address: content.contact_address
          });
        }
      }
    });
  }

  onSavePricing() {
    if (this.pricingForm.invalid) return;
    this.pricingSuccess.set('');
    this.pricingError.set('');

    const form = this.pricingForm.value;
    const payload = {
      base_rent: {
        hatchback: form.hatchback_base,
        sedan: form.sedan_base,
        suv: form.suv_base,
        crysta: form.crysta_base,
        traveller: form.traveller_base,
        minibus: form.minibus_base,
        luxury: form.luxury_base
      },
      km_rates: {
        hatchback: form.hatchback_rate,
        sedan: form.sedan_rate,
        suv: form.suv_rate,
        crysta: form.crysta_rate,
        traveller: form.traveller_rate,
        minibus: form.minibus_rate,
        luxury: form.luxury_rate
      },
      driver_salary: form.driver_salary,
      convenience_fee: form.convenience_fee,
      platform_fee: form.platform_fee,
      gst_percent: form.gst_percent,
      fuel_cost_formula: form.fuel_cost_formula,
      toll_multiplier: form.toll_multiplier,
      night_charges: form.night_charges,
      festival_charges: form.festival_charges,
      seasonal_pricing: form.seasonal_pricing,
      min_booking_amount: form.min_booking_amount,
      offers_enabled: form.offers_enabled
    };

    this.auth.updatePricingConfig(payload).subscribe({
      next: () => {
        this.pricingSuccess.set('Global pricing metrics updated successfully!');
      },
      error: () => this.pricingError.set('Failed to update pricing rules.')
    });
  }

  onSaveContent() {
    if (this.contentForm.invalid) return;
    this.contentSuccess.set('');
    this.contentError.set('');

    this.auth.updateWebsiteContent(this.contentForm.value).subscribe({
      next: () => {
        this.contentSuccess.set('Homepage content blocks updated successfully!');
        this.auth.websiteContent.set(this.contentForm.value);
      },
      error: () => this.contentError.set('Failed to save website config.')
    });
  }

  // --- Driver Management ---
  editDriver(driver: any) {
    this.editingDriverId.set(driver.id || driver._id);
    this.driverForm.patchValue({
      name: driver.name,
      email: driver.email || '',
      phone: driver.phone || '',
      experience: driver.experience,
      languages: driver.languages?.join(', ') || 'Hindi, English',
      status: driver.status,
      verified: driver.verified
    });
    this.isEditingDriver.set(true);
  }

  onSaveDriver() {
    if (this.driverForm.invalid) return;
    this.driverSuccess.set('');
    this.driverError.set('');

    const val = { ...this.driverForm.value };
    val.languages = val.languages.split(',').map((l: string) => l.trim());

    if (this.editingDriverId()) {
      this.driverService.updateDriver(this.editingDriverId()!, val).subscribe({
        next: () => {
          this.driverSuccess.set('Driver updated successfully!');
          this.loadAdminData();
          this.closeDriverForm();
        },
        error: (err) => this.driverError.set(err.error?.error || 'Failed to update.')
      });
    } else {
      this.driverService.addDriver(val).subscribe({
        next: () => {
          this.driverSuccess.set('New driver registered successfully!');
          this.loadAdminData();
          this.closeDriverForm();
        },
        error: (err) => this.driverError.set(err.error?.error || 'Failed to register driver.')
      });
    }
  }

  deleteDriver(driverId: string) {
    if (confirm('Are you sure you want to delete this driver?')) {
      this.driverService.deleteDriver(driverId).subscribe({
        next: () => {
          this.loadAdminData();
          alert('Driver deleted.');
        }
      });
    }
  }

  closeDriverForm() {
    this.isEditingDriver.set(false);
    this.editingDriverId.set(null);
    this.driverForm.reset({ experience: 2, languages: 'Hindi, English', status: 'available', verified: true });
  }

  // --- User Management ---
  editUser(user: any) {
    this.editingUserId.set(user.id);
    this.userForm.patchValue({
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status || 'active'
    });
    this.isEditingUser.set(true);
  }

  onSaveUser() {
    if (this.userForm.invalid) return;
    this.userSuccess.set('');
    this.userError.set('');

    this.auth.updateAdminUser(this.editingUserId()!, this.userForm.value).subscribe({
      next: () => {
        this.userSuccess.set('User account status updated!');
        this.loadAdminData();
        this.closeUserForm();
      },
      error: () => this.userError.set('Failed to update account.')
    });
  }

  deleteUser(userId: string) {
    if (confirm('Are you sure you want to permanently delete this account?')) {
      this.auth.deleteAdminUser(userId).subscribe({
        next: () => {
          this.loadAdminData();
          alert('User deleted.');
        }
      });
    }
  }

  closeUserForm() {
    this.isEditingUser.set(false);
    this.editingUserId.set(null);
    this.userForm.reset();
  }

  // --- Booking Management ---
  editBooking(b: Booking) {
    this.editingBookingId.set(b.id || '');
    this.bookingForm.patchValue({
      pickupLocation: b.pickupLocation,
      dropLocation: b.dropLocation || '',
      pickupDate: b.pickupDate,
      pickupTime: b.pickupTime,
      dropDate: b.dropDate,
      dropTime: b.dropTime,
      vehicleType: b.vehicleType,
      passengersCount: b.passengersCount,
      driverRequired: b.driverRequired,
      status: b.status,
      driver_id: b.driver_id || '',
      driver_name: b.driver_name || '',
      finalAmount: b.fareDetails?.finalAmount || b.fareDetails?.totalAmount || 0
    });
    this.isEditingBooking.set(true);
  }

  onSaveBooking() {
    if (this.bookingForm.invalid) return;
    this.bookingSuccess.set('');
    this.bookingError.set('');

    const formVal = this.bookingForm.value;
    const originalBooking = this.bookings().find(b => b.id === this.editingBookingId());
    
    // Construct updated payload with fare override
    const payload = {
      pickupLocation: formVal.pickupLocation,
      dropLocation: formVal.dropLocation,
      pickupDate: formVal.pickupDate,
      pickupTime: formVal.pickupTime,
      dropDate: formVal.dropDate,
      dropTime: formVal.dropTime,
      vehicleType: formVal.vehicleType,
      passengersCount: formVal.passengersCount,
      driverRequired: formVal.driverRequired,
      status: formVal.status,
      driver_id: formVal.driver_id,
      driver_name: formVal.driver_id ? (this.drivers().find(d => d.user_id === formVal.driver_id)?.name || formVal.driver_name) : '',
      fareDetails: {
        ...(originalBooking?.fareDetails || {}),
        finalAmount: parseFloat(formVal.finalAmount),
        totalAmount: parseFloat(formVal.finalAmount)
      }
    };

    this.bookingService.updateBookingDetails(this.editingBookingId()!, payload).subscribe({
      next: () => {
        this.bookingSuccess.set('Booking modified successfully!');
        this.loadAdminData();
        this.closeBookingForm();
      },
      error: () => this.bookingError.set('Failed to save booking edits.')
    });
  }

  closeBookingForm() {
    this.isEditingBooking.set(false);
    this.editingBookingId.set(null);
    this.bookingForm.reset();
  }

  cancelBooking(bookingId: string) {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.updateBookingStatus(bookingId, 'cancelled').subscribe({
        next: () => {
          this.loadAdminData();
          alert('Booking cancelled successfully.');
        },
        error: (err) => alert(err.error?.error || 'Failed to cancel booking.')
      });
    }
  }

  // --- Vehicle Management ---
  approveVehicle(vehicleId: string) {
    this.vehicleService.approveVehicle(vehicleId).subscribe({
      next: () => {
        this.loadAdminData();
        alert('Vehicle approved and listed active successfully.');
      }
    });
  }

  editVehicle(v: any) {
    this.editingVehicleId.set(v.id);
    this.vehicleForm.patchValue({
      name: v.name,
      category: v.category,
      plate_number: v.plate_number,
      seats: v.seats,
      price_per_km: v.price_per_km,
      fuel: v.fuel,
      ac: v.ac,
      driver_available: v.driver_available,
      status: v.status,
      approved: v.approved
    });
    this.isEditingVehicle.set(true);
  }

  onSaveVehicle() {
    if (this.vehicleForm.invalid) return;
    this.vehicleSuccess.set('');
    this.vehicleError.set('');

    this.vehicleService.updateVehicle(this.editingVehicleId()!, this.vehicleForm.value).subscribe({
      next: () => {
        this.vehicleSuccess.set('Vehicle settings modified!');
        this.loadAdminData();
        this.closeVehicleForm();
      },
      error: () => this.vehicleError.set('Failed to update vehicle.')
    });
  }

  deleteVehicle(vehicleId: string) {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      this.vehicleService.deleteVehicle(vehicleId).subscribe({
        next: () => {
          this.loadAdminData();
          alert('Vehicle deleted.');
        }
      });
    }
  }

  closeVehicleForm() {
    this.isEditingVehicle.set(false);
    this.editingVehicleId.set(null);
    this.vehicleForm.reset();
  }

  // --- Driver Document Verification ---
  verifyDriver(driverId: string) {
    this.driverService.updateDriverDocument(driverId, { doc_type: 'license', status: 'verified' }).subscribe({
      next: () => {
        this.driverService.updateDriverDocument(driverId, { doc_type: 'aadhar', status: 'verified' }).subscribe({
          next: () => {
            this.loadAdminData();
            alert('Driver KYC documents verified successfully!');
          }
        });
      }
    });
  }

  onUpdateProfile() {
    if (this.profileForm.invalid) return;
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
      error: () => this.profileError.set('Failed to update profile details.')
    });
  }

  // --- KYC Management Endpoints ---
  loadKycRequests() {
    this.kycService.getKycRequests().subscribe({
      next: (reqs) => this.kycRequests.set(reqs),
      error: (err) => console.error('Failed to load KYC requests', err)
    });
  }

  approveKyc(reqId: string) {
    this.kycSuccess.set('');
    this.kycError.set('');
    this.kycService.processKycRequest(reqId, { action: 'approve' }).subscribe({
      next: () => {
        this.kycSuccess.set('KYC request approved successfully.');
        this.loadKycRequests();
        this.loadAdminData(); // Refresh user statuses
      },
      error: (err) => this.kycError.set(err.error?.error || 'Failed to approve request')
    });
  }

  openKycActionModal(req: any, type: 'reject' | 'reupload') {
    this.selectedRequestForAction.set(req);
    this.kycActionType.set(type);
    this.kycActionNotes.set('');
    // Reset document selections
    Object.keys(this.reuploadDocTypes).forEach(k => this.reuploadDocTypes[k] = false);
    this.showKycModal.set(true);
  }

  closeKycModal() {
    this.showKycModal.set(false);
    this.selectedRequestForAction.set(null);
  }

  submitKycAction() {
    const req = this.selectedRequestForAction();
    if (!req) return;

    this.kycSuccess.set('');
    this.kycError.set('');

    const action = this.kycActionType() === 'reject' ? 'reject' : 'request_reupload';
    const notes = this.kycActionNotes();
    if (!notes.trim()) {
      alert('Please specify the reason/notes.');
      return;
    }

    const payload: any = { action, notes };
    if (action === 'request_reupload') {
      const docTypes = Object.keys(this.reuploadDocTypes).filter(k => this.reuploadDocTypes[k]);
      if (docTypes.length === 0) {
        alert('Please select at least one document to request re-upload.');
        return;
      }
      payload.doc_types = docTypes;
    }

    this.kycService.processKycRequest(req.id, payload).subscribe({
      next: () => {
        this.kycSuccess.set(`KYC action '${action}' processed successfully.`);
        this.closeKycModal();
        this.loadKycRequests();
        this.loadAdminData(); // Refresh profiles
      },
      error: (err) => this.kycError.set(err.error?.error || 'Failed to process action')
    });
  }

  // ── Enquiry Management ────────────────────────────────────

  loadEnquiries() {
    this.enquirySuccess.set('');
    this.enquiryError.set('');
    const filter = this.enquiryStatusFilter();
    const search = this.enquirySearch();
    this.enquiryService.getEnquiries(filter || undefined, search || undefined).subscribe({
      next: (list) => this.enquiries.set(list),
      error: (err) => this.enquiryError.set(err.error?.error || 'Failed to load enquiries.')
    });
  }

  onEnquiryFilterChange(status: string) {
    this.enquiryStatusFilter.set(status);
    this.loadEnquiries();
  }

  onEnquirySearch(term: string) {
    this.enquirySearch.set(term);
    this.loadEnquiries();
  }

  viewEnquiry(enq: any) {
    this.selectedEnquiry.set(enq);
    this.enquiryNotes.set(enq.notes || '');
    this.enquiryAssignTo.set(enq.assigned_to || '');
    this.showEnquiryDetail.set(true);
  }

  closeEnquiryDetail() {
    this.showEnquiryDetail.set(false);
    this.selectedEnquiry.set(null);
  }

  updateEnquiryStatus(newStatus: string) {
    const enq = this.selectedEnquiry();
    if (!enq) return;
    this.enquirySuccess.set('');
    this.enquiryError.set('');
    this.enquiryService.updateEnquiry(enq.id, {
      status: newStatus,
      notes: this.enquiryNotes(),
      assigned_to: this.enquiryAssignTo()
    }).subscribe({
      next: () => {
        this.enquirySuccess.set(`Enquiry marked as "${newStatus}" successfully.`);
        this.loadEnquiries();
        this.closeEnquiryDetail();
      },
      error: (err) => this.enquiryError.set(err.error?.error || 'Failed to update enquiry.')
    });
  }

  getEnquiryStatusClass(status: string): string {
    const map: Record<string, string> = {
      new: 'pending', contacted: 'verified', converted: 'verified', closed: 'rejected'
    };
    return map[status] || 'pending';
  }

  exportEnquiriesCSV() {
    const rows = this.enquiries();
    if (!rows.length) { alert('No enquiries to export.'); return; }
    const headers = ['Name','Mobile','Email','Pickup','Drop','Date','Time','Trip Type','Passengers','Bags','Vehicle','AC','Driver','Notes','Status','Created At'];
    const csvContent = [
      headers.join(','),
      ...rows.map(e => [
        `"${e.full_name || ''}"`,
        `"${e.mobile_number || ''}"`,
        `"${e.email || ''}"`,
        `"${e.pickup_location || ''}"`,
        `"${e.drop_location || ''}"`,
        `"${e.journey_date || ''}"`,
        `"${e.journey_time || ''}"`,
        `"${e.trip_type || ''}"`,
        e.passengers || 1,
        e.bags || 0,
        `"${e.vehicle_type || ''}"`,
        e.ac_required ? 'Yes' : 'No',
        e.driver_required ? 'Yes' : 'No',
        `"${(e.notes || '').replace(/"/g, "''")}"`,
        `"${e.status || 'new'}"`,
        `"${e.created_at || ''}"`,
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `enquiries_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  logout() {
    this.auth.logout();
  }
}
