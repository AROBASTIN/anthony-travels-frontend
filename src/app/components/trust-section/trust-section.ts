import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TrustProp {
  icon: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-trust-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trust-section.html',
  styleUrl: './trust-section.css'
})
export class TrustSectionComponent {
  stats = [
    { value: '25,000+', label: 'Trips Completed' },
    { value: '7,500,000+', label: 'KMs Covered' },
    { value: '100%', label: 'Verified Chauffeurs' },
    { value: '4.9/5', label: 'Average Customer Rating' }
  ];

  certifications = [
    { name: 'ISO 9001:2015', detail: 'Quality Transport Standard' },
    { name: 'TN Tourism Partner', detail: 'Official Travels Association' },
    { name: 'SGS Safety Shield', detail: '100% Sanitization & Background Verified' }
  ];

  props: TrustProp[] = [
    {
      icon: 'driver',
      title: 'Verified Chauffeurs',
      desc: 'All chauffeurs undergo strict background checks, physical verifications and professional etiquette training.'
    },
    {
      icon: 'gps',
      title: 'GPS Live Tracking',
      desc: 'Real-time live trip tracking links shared directly with family members for absolute peace of mind.'
    },
    {
      icon: 'support',
      title: '24/7 Roadside Assistance',
      desc: 'Round-the-clock telephone and emergency SOS support at your fingertips on every single tour.'
    },
    {
      icon: 'price',
      title: 'No Hidden Charges',
      desc: 'State permit taxes, GST, fuel estimates, and allowances are fully transparent on receipt.'
    },
    {
      icon: 'family',
      title: 'Family First Travel',
      desc: 'Child seat compatibility, neat sanitised interiors, and senior-friendly rest stop recommendations.'
    },
    {
      icon: 'booking',
      title: 'Instant Confirmation',
      desc: 'Secure cabs immediately on the platform or get immediate confirmations via our WhatsApp line.'
    }
  ];
}

