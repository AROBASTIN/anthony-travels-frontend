import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { EnquiryService } from '../../services/enquiry.service';

@Component({
  selector: 'app-enquiry-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './enquiry-modal.html',
  styleUrl: './enquiry-modal.css'
})
export class EnquiryModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly enquiryService = inject(EnquiryService);

  step = signal<1 | 2 | 3>(1); // 1=form, 2=preview, 3=success
  isSubmitting = signal(false);
  errorMsg = signal('');

  readonly vehicleOptions = [
    { value: 'hatchback',  label: 'Hatchback (WagonR / Tiago)' },
    { value: 'sedan',      label: 'Sedan (Dzire / Etios)' },
    { value: 'suv',        label: 'SUV (Ertiga / Carens)' },
    { value: 'crysta',     label: 'Innova Crysta' },
    { value: 'traveller',  label: 'Tempo Traveller (12–16 Seater)' },
    { value: 'minibus',    label: 'Mini Bus (21+ Seater)' },
    { value: 'luxury',     label: 'Luxury Car (Mercedes / BMW)' },
  ];

  form: FormGroup = this.fb.group({
    // Customer Details
    full_name:        ['', [Validators.required, Validators.minLength(2)]],
    mobile_number:    ['', [Validators.required, Validators.pattern('^[+0-9][0-9 \\-]{8,14}$')]],
    email:            ['', [Validators.email]],
    // Trip Details
    pickup_location:  ['', Validators.required],
    drop_location:    [''],
    journey_date:     ['', Validators.required],
    journey_time:     ['09:00'],
    return_date:      [''],
    trip_type:        ['one_way', Validators.required],
    // Passengers
    passengers:       [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    bags:             [0, [Validators.required, Validators.min(0), Validators.max(20)]],
    // Vehicle
    vehicle_type:     ['suv', Validators.required],
    ac_required:      [true],
    driver_required:  [true],
    // Extra
    special_requests: [''],
  });

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  get whatsappPhone(): string {
    const raw = this.auth.websiteContent()?.contact_phone || '+919876543210';
    return raw.replace(/[^\d+]/g, '');
  }

  get selectedVehicleLabel(): string {
    return this.vehicleOptions.find(v => v.value === this.form.value.vehicle_type)?.label || '';
  }

  /** Step 1 → Step 2: validate and show preview */
  preview() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMsg.set('Please fill all required fields correctly.');
      return;
    }
    this.errorMsg.set('');
    this.step.set(2);
  }

  back() { this.step.set(1); }

  /** Build the formatted WhatsApp message string */
  buildWhatsAppMessage(): string {
    const f = this.form.value;
    const tripLabel    = f.trip_type === 'round_trip' ? '🔄 Round Trip' : '➡️ One Way';
    const returnLine   = f.return_date ? `\n🔙 Return Date   : ${f.return_date}` : '';
    const emailLine    = f.email ? `\n📧 Email         : ${f.email}` : '';
    const specialLine  = f.special_requests ? `\n💬 Special Notes : ${f.special_requests}` : '';

    return encodeURIComponent(
`🚗 *Anthony Travels — Booking Enquiry*

👤 *Customer Details*
━━━━━━━━━━━━━━━━━━━━
📛 Name          : ${f.full_name}
📱 Mobile        : ${f.mobile_number}${emailLine}

📍 *Trip Details*
━━━━━━━━━━━━━━━━━━━━
🟢 Pickup        : ${f.pickup_location}
🔴 Drop          : ${f.drop_location || 'Not specified'}
📅 Journey Date  : ${f.journey_date}
🕐 Journey Time  : ${f.journey_time || 'Flexible'}${returnLine}
🔀 Trip Type     : ${tripLabel}

👥 *Passenger Details*
━━━━━━━━━━━━━━━━━━━━
🧑‍🤝‍🧑 Passengers   : ${f.passengers} Person(s)
🧳 Bags          : ${f.bags} Bag(s)

🚘 *Vehicle Preference*
━━━━━━━━━━━━━━━━━━━━
🚙 Vehicle       : ${this.selectedVehicleLabel}
❄️  AC Required   : ${f.ac_required ? 'Yes' : 'No'}
🧑‍✈️ Driver Needed : ${f.driver_required ? 'Yes' : 'No'}${specialLine}

━━━━━━━━━━━━━━━━━━━━
Please share the quotation and vehicle availability. 🙏`
    );
  }

  /** Open WhatsApp with prefilled message */
  openWhatsApp() {
    const phone = this.whatsappPhone;
    const msg   = this.buildWhatsAppMessage();
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  /** Save to MongoDB + open WhatsApp */
  async confirm() {
    this.isSubmitting.set(true);
    this.errorMsg.set('');
    const payload = { ...this.form.value };

    this.enquiryService.submitEnquiry(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.openWhatsApp();
        this.step.set(3);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        // Still open WhatsApp even if DB save fails
        this.openWhatsApp();
        this.step.set(3);
        console.error('Enquiry save error (non-blocking):', err);
      }
    });
  }

  close() { this.closeModal.emit(); }

  adjustPassengers(delta: number) {
    const cur = +this.form.get('passengers')!.value;
    const next = Math.max(1, Math.min(50, cur + delta));
    this.form.get('passengers')!.setValue(next);
  }

  adjustBags(delta: number) {
    const cur = +this.form.get('bags')!.value;
    const next = Math.max(0, Math.min(20, cur + delta));
    this.form.get('bags')!.setValue(next);
  }
}
