import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-solicitudes',
  templateUrl: './solicitudes.page.html',
  styleUrls: ['./solicitudes.page.scss'],
  standalone: false
})
export class SolicitudesPage implements OnInit {
  allRequests: any[] = [];
  filteredRequests: any[] = [];
  currentFilter: string = 'pending';
  isLoading: boolean = true;

  constructor(
    private firebaseSvc: FirebaseService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.checkAdminAccess();
    await this.loadRequests();
  }

  async checkAdminAccess() {
    try {
      const auth = this.firebaseSvc.getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        const path = `users/${currentUser.uid}`;
        const userData = await this.firebaseSvc.getDocument(path);
        
        if (userData?.['rol'] !== 'admin') {
          // Si no es admin, mostrar mensaje y redirigir
          this.showUnauthorizedMessage();
          this.router.navigate(['/main/home']);
        }
      } else {
        // Si no hay usuario autenticado, redirigir al login
        this.router.navigate(['/auth/login']);
      }
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      this.showUnauthorizedMessage();
      this.router.navigate(['/main/home']);
    }
  }

  async loadRequests() {
  
    this.isLoading = true; 
  
    try {
      // Obtener todas las solicitudes
      this.allRequests = await this.firebaseSvc.getCollection('landlordRequests');
      
      // Ordenar por fecha (más recientes primero)
      this.allRequests.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      this.filterRequests();
      this.isLoading = false;
      // await loading.dismiss(); // Eliminamos esta línea
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      this.isLoading = false;
      // await loading.dismiss(); // Eliminamos esta línea
      
      const toast = await this.toastCtrl.create({
        message: 'Error al cargar las solicitudes',
        duration: 3000,
        color: 'danger',
        mode: 'ios',
        position: 'bottom'
      });
      toast.present();
    }
  }
  

  filterRequests() {
    this.filteredRequests = this.allRequests.filter(
      request => request.status === this.currentFilter
    );
  }

  getBadgeColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return status;
    }
  }

  async approveRequest(request: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar aprobación',
      message: `¿Estás seguro de aprobar la solicitud de ${request.userName} ${request.userLastName}?`,
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aprobar',
          handler: async () => {
            await this.updateRequestStatus(request, 'approved');
            await this.updateUserRole(request.userId, 'arrendador');
          }
        }
      ]
    });
    await alert.present();
  }

  async rejectRequest(request: any) {
    const alert = await this.alertCtrl.create({
      header: 'Rechazar solicitud',
      message: `¿Por qué rechazas la solicitud de ${request.userName} ${request.userLastName}?`,
      mode: 'ios',
      inputs: [
        {
          name: 'message',
          type: 'textarea',
          placeholder: 'Motivo del rechazo (opcional)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Rechazar',
          handler: async (data) => {
            await this.updateRequestStatus(request, 'rejected', data.message);
          }
        }
      ]
    });
    await alert.present();
  }

  async updateRequestStatus(request: any, status: string, message: string = '') {
    const loading = await this.loadingCtrl.create({
      message: 'Actualizando solicitud...',
      mode: 'ios',
      spinner: 'circular'
    });
    await loading.present();
  
    try {
      // Actualizar el estado de la solicitud
      const path = `landlordRequests/${request.id}`;
      await this.firebaseSvc.updateDocument(path, {
        status,
        message,
        updatedAt: new Date()
      });
      
      // Actualizar la lista local
      const index = this.allRequests.findIndex(r => r.id === request.id);
      if (index !== -1) {
        this.allRequests[index].status = status;
        this.allRequests[index].message = message;
        this.filterRequests();
      }
      
      await loading.dismiss();
      
      const toast = await this.toastCtrl.create({
        message: `Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} correctamente`,
        duration: 2000,
        color: 'success',
        mode: 'ios',
        position: 'bottom'
      });
      toast.present();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Error al actualizar solicitud:', error);
      
      const errorToast = await this.toastCtrl.create({
        message: 'Error al actualizar la solicitud',
        duration: 3000,
        color: 'danger',
        mode: 'ios',
        position: 'bottom'
      });
      errorToast.present();
    }
  }

  async updateUserRole(userId: string, role: string) {
    try {
      const path = `users/${userId}`;
      await this.firebaseSvc.updateDocument(path, { rol: role });
      
      console.log(`Rol de usuario ${userId} actualizado a ${role}`);
    } catch (error) {
      console.error('Error al actualizar rol de usuario:', error);
      
      const errorToast = await this.toastCtrl.create({
        message: 'Error al actualizar el rol del usuario',
        duration: 3000,
        color: 'danger',
        mode: 'ios',
        position: 'bottom'
      });
      errorToast.present();
    }
  }

  async showUnauthorizedMessage() {
    const toast = await this.toastCtrl.create({
      message: 'No tienes permisos para acceder a esta página',
      duration: 3000,
      color: 'danger',
      mode: 'ios',
      position: 'middle'
    });
    toast.present();
  }

  doRefresh(event) {
    this.loadRequests().then(() => {
      event.target.complete();
    });
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    try {
      // Convertir Timestamp de Firestore a Date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha no disponible';
    }
  }
  
  

}
