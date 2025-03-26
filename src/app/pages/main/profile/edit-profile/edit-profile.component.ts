import { Component, Input } from '@angular/core';
import { IonicModule, ModalController, ToastController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from 'src/app/services/firebase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class EditProfileComponent {
  @Input() name: string;
  @Input() apellido: string;
  @Input() userId: string;

  userData = {
    name: '',
    apellido: ''
  };

  constructor(
    private modalCtrl: ModalController,
    private firebaseSvc: FirebaseService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.userData.name = this.name;
    this.userData.apellido = this.apellido;
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async save() {
    if (!this.userData.name || !this.userData.apellido) {
      this.presentToast('Por favor complete todos los campos', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Actualizando perfil...',
      spinner: 'crescent',
      mode: 'ios'
    });
    await loading.present();

    try {
      const path = `users/${this.userId}`;

      // Primero, obtener el documento completo del usuario
      const userData: any = await this.firebaseSvc.getDocument(path);

      if (!userData) {
        throw new Error('No se pudo obtener la información del usuario');
      }

      // Actualizar solo los campos específicos usando notación de corchetes
      userData['name'] = this.userData.name;
      userData['apellido'] = this.userData.apellido;

      // Guardar el documento actualizado completo
      await this.firebaseSvc.setDocument(path, userData);

      await loading.dismiss();
      this.presentToast('Perfil actualizado exitosamente', 'success');
      this.modalCtrl.dismiss({
        name: this.userData.name,
        apellido: this.userData.apellido
      });
    } catch (error) {
      await loading.dismiss();
      console.error('Error al actualizar el perfil:', error);
      this.presentToast('Error al actualizar el perfil', 'danger');
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color,
      mode: 'ios'
    });
    await toast.present();
  }
}
