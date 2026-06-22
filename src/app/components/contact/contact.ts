import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { EnquiryService } from '../../services/enquiry.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class ContactComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly enquiryService = inject(EnquiryService);

  contactForm!: FormGroup;
  isSubmitting = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  submittedEnquiryId = signal('');

  readonly vehicleOptions = [
    { value: 'hatchback',  label: 'Hatchback (WagonR / Tiago)' },
    { value: 'sedan',      label: 'Sedan (Dzire / Etios)' },
    { value: 'suv',        label: 'SUV (Ertiga / Carens)' },
    { value: 'crysta',     label: 'Innova Crysta' },
    { value: 'traveller',  label: 'Tempo Traveller (12–16 Seater)' },
    { value: 'minibus',    label: 'Mini Bus (21+ Seater)' },
    { value: 'luxury',     label: 'Luxury Car (Mercedes / BMW)' },
  ];

  ngOnInit(): void {
    // Current local date in YYYY-MM-DD for date-picker default
    const todayStr = new Date().toISOString().split('T')[0];

    this.contactForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      mobile_number: ['', [Validators.required, Validators.pattern('^[+0-9][0-9 \\-]{8,14}$')]],
      pickup_location: ['', Validators.required],
      drop_location: [''],
      journey_date: [todayStr, Validators.required],
      vehicle_type: ['suv', Validators.required],
      message: ['', Validators.required]
    });
  }

  onSubmit() {
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid) {
      this.errorMsg.set('Please fill in all required fields correctly.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');
    this.submittedEnquiryId.set('');

    const formVal = this.contactForm.value;
    const payload = {
      full_name: formVal.full_name,
      mobile_number: formVal.mobile_number,
      pickup_location: formVal.pickup_location,
      drop_location: formVal.drop_location || '',
      journey_date: formVal.journey_date,
      vehicle_type: formVal.vehicle_type,
      special_requests: formVal.message,
      // Default matching values for backend
      trip_type: 'one_way' as const,
      passengers: 1,
      bags: 0,
      ac_required: true,
      driver_required: true
    };

    this.enquiryService.submitEnquiry(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.submittedEnquiryId.set(res.enquiry_id || '');
        this.successMsg.set('Your enquiry has been successfully registered!');
        this.contactForm.reset({
          full_name: '',
          mobile_number: '',
          pickup_location: '',
          drop_location: '',
          journey_date: new Date().toISOString().split('T')[0],
          vehicle_type: 'suv',
          message: ''
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMsg.set(err.error?.error || 'Failed to submit enquiry. Please check your network and try again.');
        console.error('Quick enquiry submit error:', err);
      }
    });
  }

  resetSuccess() {
    this.successMsg.set('');
    this.submittedEnquiryId.set('');
    this.errorMsg.set('');
  }
}
