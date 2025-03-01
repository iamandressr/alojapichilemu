import { Component, Input } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-edituser',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Editar Usuario</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancel()">Cancelar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="stacked">Nombre</ion-label>
        <ion-input [(ngModel)]="user.name"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Apellido</ion-label>
        <ion-input [(ngModel)]="user.apellido"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Rol</ion-label>
        <ion-select [(ngModel)]="user.rol">
          <ion-select-option value="admin">Administrador</ion-select-option>
          <ion-select-option value="cliente">Cliente</ion-select-option>
          <ion-select-option value="arrendador">Arrendador</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-button expand="block" (click)="saveChanges()" class="ion-margin-top">
        Guardar Cambios
      </ion-button>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, FormsModule]
})
export class EdituserComponent {
  @Input() user: any;

  constructor(
    private modalCtrl: ModalController,
    private firebaseSvc: FirebaseService,
    private toastCtrl: ToastController
  ) { }

  async saveChanges() {
    const path = `users/${this.user.id}`;
    await this.firebaseSvc.setDocument(path, this.user);
    
    const toast = await this.toastCtrl.create({
      message: 'Usuario actualizado exitosamente',
      duration: 2000,
      position: 'bottom',
      color: 'success',
      mode: 'ios'
    });
    
    await toast.present();
    this.modalCtrl.dismiss(true); // Emitimos true al cerrar
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
}
