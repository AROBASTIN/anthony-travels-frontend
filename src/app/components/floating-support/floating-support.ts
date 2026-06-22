import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { EnquiryModalComponent } from '../enquiry-modal/enquiry-modal';

@Component({
  selector: 'app-floating-support',
  standalone: true,
  imports: [CommonModule, EnquiryModalComponent],
  templateUrl: './floating-support.html',
  styleUrl: './floating-support.css'
})
export class FloatingSupportComponent {
  readonly auth = inject(AuthService);
  isOpen = signal(false);
  showEnquiryModal = signal(false);

  toggleMenu() { this.isOpen.update(val => !val); }

  openEnquiry() {
    this.isOpen.set(false);
    this.showEnquiryModal.set(true);
  }

  closeEnquiry() { this.showEnquiryModal.set(false); }

  /** Strip all non-digit characters (except leading +) for wa.me URL */
  getWhatsAppPhone(): string {
    const raw = this.auth.websiteContent()?.contact_phone || '+919876543210';
    return raw.replace(/[^\d+]/g, '');
  }

  getCallPhone(): string {
    return this.auth.websiteContent()?.contact_phone || '+919876543210';
  }

  getEmail(): string {
    return this.auth.websiteContent()?.contact_email || 'support@anthonytravels.com';
  }
}
