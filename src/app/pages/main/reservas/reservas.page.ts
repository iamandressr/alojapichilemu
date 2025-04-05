import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.page.html',
  styleUrls: ['./reservas.page.scss'],
  standalone: false,
})
export class ReservasPage implements OnInit {
  isLoading: boolean = true;
  reservations: any[] = [];
  userRole: string = 'cliente'; // Por defecto, asumimos que es cliente
  selectedSegment: string = 'received'; // Por defecto, mostrar reservas recibidas
  userId: string = '';

  constructor(
    private firebaseSvc: FirebaseService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.loadUserData();
    await this.loadReservations();
  }

  async ionViewWillEnter() {
    // Recargar datos cada vez que se entra a la página
    await this.loadReservations();
  }

  async loadUserData() {
    try {
      // Obtener el usuario actual
      const currentUser: any = await this.firebaseSvc.getCurrentUser();
      
      if (!currentUser) {
        console.error('No hay usuario autenticado');
        return;
      }
      
      this.userId = currentUser.uid;
      
      // Obtener datos del usuario
      const userData: any = await this.firebaseSvc.getDocument(`users/${currentUser.uid}`);
      
      if (userData && userData.rol) {
        this.userRole = userData.rol;
        
        // Si es cliente, solo mostrar "made"
        if (this.userRole === 'cliente') {
          this.selectedSegment = 'made';
        }
      }
      
      console.log('Rol de usuario:', this.userRole);
    } catch (error) {
      console.error('Error al cargar datos de usuario:', error);
    }
  }

  async loadReservations() {
    this.isLoading = true;
    this.reservations = [];
    
    try {
      // Cargar todas las reservas relevantes para el usuario
      await this.loadReservationsAsTenant();
      
      // Si es arrendador o administrador, también cargar las reservas recibidas
      if (this.userRole === 'arrendador' || this.userRole === 'admin') {
        await this.loadReservationsAsOwner();
      }
      
      // Eliminar duplicados basados en el ID de la reserva
      this.reservations = this.removeDuplicateReservations(this.reservations);
      
      // Ordenar reservas por fecha de creación (más recientes primero)
      this.reservations.sort((a, b) => {
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      });
      
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  // Método para eliminar reservas duplicadas
  removeDuplicateReservations(reservations: any[]): any[] {
    const uniqueReservations = [];
    const seenIds = new Set();
    
    for (const reservation of reservations) {
      if (!seenIds.has(reservation.id)) {
        seenIds.add(reservation.id);
        uniqueReservations.push(reservation);
      }
    }
    
    return uniqueReservations;
  }

  async loadReservationsAsTenant() {
    try {
      // Obtener reservas realizadas por el usuario (como inquilino)
      const reservationsData = await this.firebaseSvc.getCollectionQuery(
        'reservations',
        'userId',
        '==',
        this.userId
      );
      
      // Para cada reserva, obtener los detalles de la publicación
      for (const reservation of reservationsData) {
        // Marcar estas reservas como "made" (realizadas por el usuario)
        reservation.type = 'made';
        
        // Obtener detalles de la publicación
        if (reservation.publicationId) {
          const publication = await this.firebaseSvc.getDocument(`publications/${reservation.publicationId}`);
          
          if (publication) {
            // Corregir el acceso a las propiedades usando notación de corchetes
            reservation.publicationTitle = publication['title'];
            reservation.ownerName = publication['userName'] + ' ' + publication['userLastName'];
            reservation.ownerEmail = publication['userEmail'];
            reservation.ownerPhone = publication['userPhone'];
          } else {
            reservation.publicationTitle = 'Publicación no disponible';
          }
        }
        
        this.reservations.push(reservation);
      }
    } catch (error) {
      console.error('Error al cargar reservas como inquilino:', error);
    }
  }

  async loadReservationsAsOwner() {
    try {
      // Primero, obtener todas las publicaciones del usuario
      const publications = await this.firebaseSvc.getCollectionQuery(
        'publications',
        'userId',
        '==',
        this.userId
      );
      
      // Para cada publicación, obtener las reservas asociadas
      for (const publication of publications) {
        const reservationsData = await this.firebaseSvc.getCollectionQuery(
          'reservations',
          'publicationId',
          '==',
          publication.id
        );
        
        // Agregar detalles de la publicación a cada reserva
        for (const reservation of reservationsData) {
          // Marcar estas reservas como "received" (recibidas como propietario)
          reservation.type = 'received';
          reservation.publicationTitle = publication['title']; // Usar notación de corchetes
          
          this.reservations.push(reservation);
        }
      }
    } catch (error) {
      console.error('Error al cargar reservas como propietario:', error);
    }
  }

  // Filtrar reservas según el segmento seleccionado
  getFilteredReservations() {
    if (this.userRole === 'cliente') {
      // Los clientes solo ven sus propias reservas
      return this.reservations.filter(r => r.type === 'made');
    } else if (this.userRole === 'admin' || this.userRole === 'arrendador') {
      // Los arrendadores y administradores ven según el segmento seleccionado
      return this.reservations.filter(r => r.type === this.selectedSegment);
    } else {
      return this.reservations;
    }
  }

  // Obtener color según el estado de la reserva
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  // Obtener texto según el estado de la reserva
  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  }

  // Formatear fecha
  formatDate(dateValue: any): string {
    if (!dateValue) return 'No disponible';
    
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Actualizar estado de una reserva (para arrendadores)
  async updateReservationStatus(reservationId: string, newStatus: string) {
    const alert = await this.alertCtrl.create({
      header: newStatus === 'confirmed' ? 'Confirmar Reserva' : 'Cancelar Reserva',
      message: `¿Estás seguro de que deseas ${newStatus === 'confirmed' ? 'confirmar' : 'cancelar'} esta reserva?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            await this.processStatusUpdate(reservationId, newStatus);
          }
        }
      ]
    });
    
    await alert.present();
  }

  // Cancelar mi propia reserva (para clientes)
  async cancelMyReservation(reservationId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar Reserva',
      message: '¿Estás seguro de que deseas cancelar esta reserva?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Sí, Cancelar',
          handler: async () => {
            await this.processStatusUpdate(reservationId, 'cancelled');
          }
        }
      ]
    });
    
    await alert.present();
  }

  // Procesar la actualización del estado
  async processStatusUpdate(reservationId: string, newStatus: string) {
    try {
      const loading = await this.loadingCtrl.create({
        message: 'Actualizando reserva...'
      });
      await loading.present();
      
      // Actualizar el estado de la reserva
      await this.firebaseSvc.updateDocument(`reservations/${reservationId}`, {
        status: newStatus
      });
      
      // Actualizar la lista local
      const index = this.reservations.findIndex(r => r.id === reservationId);
      if (index !== -1) {
        this.reservations[index].status = newStatus;
      }
      
      await loading.dismiss();
      
      // Mostrar mensaje de éxito
      const toast = await this.toastCtrl.create({
        message: `Reserva ${newStatus === 'confirmed' ? 'confirmada' : 'cancelada'} con éxito`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Error al actualizar estado de reserva:', error);
      
      const toast = await this.toastCtrl.create({
        message: 'Error al actualizar la reserva',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
