import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoginMode = signal<boolean>(true);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9+\\s\\-]{10,15}$')]],
    role: ['customer', [Validators.required]],
    experience: [2, [Validators.min(0)]],
    languages: ['Hindi, English']
  });

  toggleMode() {
    this.isLoginMode.update(val => !val);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('Login successful! Redirecting...');
        
        setTimeout(() => {
          this.redirectBasedOnRole(res.user.role);
        }, 1000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Invalid credentials. Please try again.');
      }
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = { ...this.registerForm.value };
    if (formValue.role === 'driver') {
      formValue.languages = formValue.languages.split(',').map((l: string) => l.trim());
    } else {
      delete formValue.experience;
      delete formValue.languages;
    }

    this.authService.register(formValue).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Registration successful! Please login.');
        this.isLoginMode.set(true);
        this.loginForm.reset({ email: formValue.email, password: '' });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Registration failed. Try again.');
      }
    });
  }

  private redirectBasedOnRole(role: string) {
    if (role === 'customer') {
      this.router.navigate(['/dashboard/customer']);
    } else if (role === 'driver') {
      this.router.navigate(['/dashboard/driver']);
    } else if (role === 'cab_owner') {
      this.router.navigate(['/dashboard/cab-owner']);
    } else if (role === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
