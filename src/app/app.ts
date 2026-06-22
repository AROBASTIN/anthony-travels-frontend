import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';
import { FloatingSupportComponent } from './components/floating-support/floating-support';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    NavbarComponent,
    FooterComponent,
    FloatingSupportComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
