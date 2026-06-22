import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  
  isMobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(val => !val);
  }

  scrollToSection(sectionId: string) {
    this.isMobileMenuOpen.set(false);
    // If not on homepage, navigate to homepage first then scroll
    if (this.router.url !== '/') {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.doScroll(sectionId), 200);
      });
    } else {
      this.doScroll(sectionId);
    }
  }

  private doScroll(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToDashboard() {
    this.isMobileMenuOpen.set(false);
    const user = this.auth.currentUser();
    if (user) {
      const rolePath = user.role.replace('_', '-');
      this.router.navigate([`/dashboard/${rolePath}`]);
    }
  }
}
