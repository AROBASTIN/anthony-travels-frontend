import { Component } from '@angular/core';
import { HeroComponent } from '../hero/hero';
import { VehicleGridComponent } from '../vehicle-grid/vehicle-grid';
import { FareCalculatorComponent } from '../fare-calculator/fare-calculator';
import { TrustSectionComponent } from '../trust-section/trust-section';
import { ReviewsComponent } from '../reviews/reviews';
import { FaqComponent } from '../faq/faq';
import { ContactComponent } from '../contact/contact';
import { TourismPackagesComponent } from '../tourism-packages/tourism-packages';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    VehicleGridComponent,
    TourismPackagesComponent,
    FareCalculatorComponent,
    TrustSectionComponent,
    ReviewsComponent,
    FaqComponent,
    ContactComponent
  ],
  template: `
    <app-hero></app-hero>
    <app-vehicle-grid></app-vehicle-grid>
    <app-tourism-packages></app-tourism-packages>
    <app-fare-calculator></app-fare-calculator>
    <app-trust-section></app-trust-section>
    <app-reviews></app-reviews>
    <app-faq></app-faq>
    <app-contact></app-contact>
  `
})
export class HomeComponent {}
