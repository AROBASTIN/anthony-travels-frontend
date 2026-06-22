import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
  readonly auth = inject(AuthService);
  currentYear = new Date().getFullYear();

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  alert(message: string) {
    window.alert(message);
  }

  /** Strip all non-digit characters (except leading +) for wa.me URL */
  getWhatsAppPhone(): string {
    const raw = this.auth.websiteContent()?.contact_phone || '+919876543210';
    return raw.replace(/[^\d+]/g, '');
  }
}
