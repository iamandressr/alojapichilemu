import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from './services/firebase.service';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { AlertController, MenuController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  userData: any = {};

  constructor(
    private router: Router,
    private firebaseSvc: FirebaseService,
    private alertCtrl: AlertController,
    private menuCtrl: MenuController,
  ) {}

  ngOnInit() {
    this.checkUser();
  }

  checkUser() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const path = `users/${user.uid}`;
        this.userData = await this.firebaseSvc.getDocument(path);
      }
    });
  }

  isAuthPage() {
    return this.router.url.includes('/auth');
  }

  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Está seguro que desea cerrar sesión?',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, cerrar sesión',
          handler: () => {
            this.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  async logout() {
    const auth = getAuth();
    await signOut(auth);
    this.router.navigate(['/auth']);
  }

  async navigateAndCloseMenu(path: string) {
    await this.router.navigate([path]);
    await this.menuCtrl.close();
  }
}
