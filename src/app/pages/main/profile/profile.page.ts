import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user.model';
import { getAuth } from 'firebase/auth';
import { AlertController, ModalController } from '@ionic/angular';
import { EditProfileComponent } from './edit-profile/edit-profile.component';



@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {

  user: User;
  isLoading: boolean = true;

  constructor(
    private firebaseSvc: FirebaseService,
    private alertController: AlertController,
    private modalController: ModalController
  ) { }

  async ngOnInit() {
    await this.getUserInfo();
  }

  async getUserInfo() {
    try {
      this.isLoading = true;
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        const path = `users/${currentUser.uid}`;
        const userDoc = await this.firebaseSvc.getDocument(path);
        this.user = userDoc as User;
      } else {
        this.presentAlert('Error', 'No hay usuario autenticado');
      }
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      this.presentAlert('Error', 'No se pudieron cargar los datos del perfil');
    } finally {
      this.isLoading = false;
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async openEditNameModal() {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      this.presentAlert('Error', 'No hay usuario autenticado');
      return;
    }

    const modal = await this.modalController.create({
      component: EditProfileComponent,
      componentProps: {
        name: this.user.name,
        apellido: this.user.apellido,
        userId: currentUser.uid
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data && data.name && data.apellido) {
      // Actualizar localmente
      this.user.name = data.name;
      this.user.apellido = data.apellido;

      // No es necesario actualizar en Firebase aquí, ya se hizo en el modal
    }
  }

}
