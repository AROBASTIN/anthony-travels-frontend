import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Package {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  price: number;
  category: 'pilgrimage' | 'family' | 'honeymoon' | 'weekend';
  imageClass: string;
  destinations: string[];
  highlights: string[];
  itinerarySummary: string;
}

@Component({
  selector: 'app-tourism-packages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tourism-packages.html',
  styleUrl: './tourism-packages.css'
})
export class TourismPackagesComponent {
  activeFilter = signal<'all' | 'pilgrimage' | 'family' | 'honeymoon' | 'weekend'>('all');

  packages: Package[] = [
    {
      id: 'pkg-pilgrimage',
      title: 'Devotional Tamil Nadu Heritage Tour',
      subtitle: 'A spiritual pilgrimage through architectural wonders.',
      duration: '4 Days / 3 Nights',
      price: 9999,
      category: 'pilgrimage',
      imageClass: 'madurai',
      destinations: ['Madurai', 'Rameswaram', 'Thanjavur'],
      highlights: ['Meenakshi Temple Darshan', 'Rameswaram holy baths', 'Brihadisvara Temple audit'],
      itinerarySummary: 'Ex Chennai / Madurai, covering top temples with verified tour guides.'
    },
    {
      id: 'pkg-family',
      title: 'Queen of Hill Stations getaway',
      subtitle: 'Misty landscapes & scenic lake tours for the whole family.',
      duration: '5 Days / 4 Nights',
      price: 14999,
      category: 'family',
      imageClass: 'ooty',
      destinations: ['Ooty', 'Kodaikanal', 'Coonoor'],
      highlights: ['Nilgiri Toy Train Ride', 'Pine forests & botanical gardens', 'Boating at Pykara'],
      itinerarySummary: 'Perfect family package with spacious SUV transit and premium stays.'
    },
    {
      id: 'pkg-honeymoon',
      title: 'Misty Romance & Scenic Valleys',
      subtitle: 'A romantic honeymoon retreat amidst misty mountains.',
      duration: '3 Days / 2 Nights',
      price: 12499,
      category: 'honeymoon',
      imageClass: 'kodaikanal',
      destinations: ['Kodaikanal', 'Courtallam Falls'],
      highlights: ['Private boating', 'Coaker\'s Walk sunset view', 'Courtallam therapeutic spa bath'],
      itinerarySummary: 'Private sedan transit with dedicated chauffeur and romantic candlelit dinner.'
    },
    {
      id: 'pkg-weekend',
      title: 'Coastal Heritage & Sunset Point',
      subtitle: 'Stunning shore temples & coastal wonders of the South.',
      duration: '2 Days / 1 Night',
      price: 5499,
      category: 'weekend',
      imageClass: 'weekend',
      destinations: ['Mahabalipuram', 'Pondicherry', 'Kanyakumari'],
      highlights: ['Shore Temple sunrise', 'Pondicherry French Quarter walk', 'Vivekananda Rock Memorial'],
      itinerarySummary: 'Fast-paced weekend relaxation package with sightseeing transfers.'
    }
  ];

  filteredPackages() {
    const filter = this.activeFilter();
    if (filter === 'all') return this.packages;
    return this.packages.filter(p => p.category === filter);
  }

  setFilter(filter: 'all' | 'pilgrimage' | 'family' | 'honeymoon' | 'weekend') {
    this.activeFilter.set(filter);
  }

  selectPackage(pkg: Package) {
    const pickupLoc = document.querySelector('input[formControlName="pickupLocation"]') as HTMLInputElement;
    const dropLoc = document.querySelector('input[formControlName="dropLocation"]') as HTMLInputElement;
    const vehicleTypeSelect = document.querySelector('select[formControlName="vehicleType"]') as HTMLSelectElement;

    if (pickupLoc) {
      pickupLoc.value = 'Chennai / Madurai';
      pickupLoc.dispatchEvent(new Event('input'));
    }
    if (dropLoc) {
      dropLoc.value = pkg.destinations.join(' - ');
      dropLoc.dispatchEvent(new Event('input'));
    }
    if (vehicleTypeSelect) {
      vehicleTypeSelect.value = pkg.category === 'family' ? 'suv' : 'sedan';
      vehicleTypeSelect.dispatchEvent(new Event('change'));
    }

    const bookingSection = document.getElementById('hero');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
