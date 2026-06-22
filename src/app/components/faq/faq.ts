import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FAQItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class FaqComponent {
  faqs = signal<FAQItem[]>([
    {
      question: 'Can I book without a driver?',
      answer: 'No, Anthony Travels operates exclusively as a professional chauffeured service. To ensure passenger safety, vehicle maintenance, and stress-free travel, we do not offer self-drive rentals.',
      isOpen: false
    },
    {
      question: 'How are fuel charges calculated?',
      answer: 'Fuel costs are calculated transparently using: (Total Trip Distance / Vehicle Mileage) * Live Fuel Rate. Our system tracks current Petrol and Diesel rates in real-time, displaying the exact cost before you make a payment.',
      isOpen: false
    },
    {
      question: 'What is the cancellation policy?',
      answer: 'We offer free cancellation up to 24 hours prior to your scheduled pickup time. Cancellations made within 24 hours of the trip will incur a nominal fee equivalent to the platform fee or 10% token deposit.',
      isOpen: false
    },
    {
      question: 'Can I modify my booking details?',
      answer: 'Yes. You can modify your pickup time, date, or vehicle category up to 12 hours before the trip. Simply contact our support desk via WhatsApp or Call, and we will update your itinerary without modification fees.',
      isOpen: false
    },
    {
      question: 'How is the trip distance calculated?',
      answer: 'The trip distance is estimated based on the shortest route calculated by Google Maps APIs. During the journey, the actual distance is recorded using our GPS-enabled odometer tracking to ensure accurate final invoicing.',
      isOpen: false
    }
  ]);

  toggleFaq(index: number) {
    this.faqs.update(items => {
      return items.map((item, idx) => {
        if (idx === index) {
          return { ...item, isOpen: !item.isOpen };
        }
        return { ...item, isOpen: false }; // Accordion mode: close others
      });
    });
  }
}
