import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface UserProfile {
  displayName: string;
  userPrincipalName: string;
  mail: string | null;
}

@Component({
  imports: [],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {

  private http = inject(HttpClient);

  profile = signal<UserProfile | null>(null);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {

    this.http
      .get<UserProfile>('https://graph.microsoft.com/v1.0/me')
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
        },

        error: (error) => {
          console.error('Error al obtener perfil:', error);

          this.errorMessage.set(
            'No fue posible obtener los datos del usuario.'
          );
        }
      });
  }
}