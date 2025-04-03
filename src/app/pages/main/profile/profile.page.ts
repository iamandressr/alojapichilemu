import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user.model';
import { getAuth } from 'firebase/auth';
import { AlertController, ModalController, ToastController, LoadingController } from '@ionic/angular';
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
  hasPendingRequest: boolean = false;

  constructor(
    private firebaseSvc: FirebaseService,
    private alertController: AlertController,
    private modalController: ModalController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { }

  async ngOnInit() {
    await this.getUserInfo();
    await this.checkPendingRequests();
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

  async checkPendingRequests() {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser && this.user) {
        // Buscar solicitudes pendientes del usuario actual
        const requests = await this.firebaseSvc.getCollectionQuery(
          'landlordRequests',
          'userId',
          '==',
          currentUser.uid
        );
        
        // Verificar si hay solicitudes pendientes
        this.hasPendingRequest = requests.some(req => req.status === 'pending');
      }
    } catch (error) {
      console.error('Error al verificar solicitudes pendientes:', error);
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      mode: 'ios',
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

  async requestLandlordRole() {
    // Mostrar confirmación antes de enviar la solicitud
    const alert = await this.alertController.create({
      header: 'Solicitar ser Arrendador',
      mode: 'ios',
      message: '¿Estás seguro que deseas enviar una solicitud para convertirte en arrendador? Esto te permitirá publicar propiedades para alquilar.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar Solicitud',
          handler: async () => {
            await this.submitLandlordRequest();
          }
        }
      ]
    });

    await alert.present();
  }

  async submitLandlordRequest() {
    const loading = await this.loadingCtrl.create({
      mode: 'ios',
      message: 'Enviando solicitud...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      // Crear la solicitud
      const requestData = {
        userId: currentUser.uid,
        userName: this.user.name,
        userLastName: this.user.apellido,
        userEmail: this.user.email,
        userPhone: this.user.telefono || '',
        createdAt: new Date(),
        status: 'pending', // pending, approved, rejected
        message: '' // Para comentarios del administrador
      };

      // Guardar la solicitud en Firestore
      await this.firebaseSvc.addDocument('landlordRequests', requestData);
      
      await loading.dismiss();
      
      // Mostrar mensaje de éxito
      const toast = await this.toastCtrl.create({
        mode: 'ios',
        message: 'Tu solicitud ha sido enviada. Te notificaremos cuando sea revisada.',
        duration: 3000,
        color: 'success',
        position: 'bottom'
      });
      toast.present();
      
      // Actualizar el estado de la solicitud en la interfaz
      this.hasPendingRequest = true;
      
    } catch (error) {
      await loading.dismiss();
      console.error('Error al enviar solicitud:', error);
      
      this.presentAlert('Error', 'No se pudo enviar la solicitud. Por favor, intenta de nuevo.');
    }
  }
}
