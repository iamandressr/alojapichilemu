import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { AlertController, LoadingController, ToastController, ModalController, ActionSheetController   } from '@ionic/angular';


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
  isScanning: boolean = false;

  constructor(
    private firebaseSvc: FirebaseService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController
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

   // Método para abrir opciones de gestión de arriendo
   async openRentalManagement(reservation: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `Gestionar Arriendo: ${reservation.publicationTitle}`,
      buttons: [
        {
          text: 'Iniciar Arriendo Manualmente',
          icon: 'home',
          handler: () => {
            this.startRental(reservation);
          }
        },
        {
          text: 'Escanear Código QR',
          icon: 'qr-code',
          handler: () => {
            this.simulateQRScan(reservation);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  // Método para iniciar arriendo
  async startRental(reservation: any) {
    const loading = await this.loadingCtrl.create({
      message: 'Iniciando arriendo...'
    });
    await loading.present();

    try {
      // Actualizar el estado del arriendo en Firestore
      await this.firebaseSvc.updateDocument(`reservations/${reservation.id}`, {
        rentalActive: true,
        rentalStartDate: new Date()
      });

      // Actualizar localmente
      const index = this.reservations.findIndex(r => r.id === reservation.id);
      if (index !== -1) {
        this.reservations[index].rentalActive = true;
        this.reservations[index].rentalStartDate = new Date();
      }

      await loading.dismiss();

      const toast = await this.toastCtrl.create({
        message: 'Arriendo iniciado con éxito',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error al iniciar arriendo:', error);
      await loading.dismiss();
      
      const toast = await this.toastCtrl.create({
        message: 'Error al iniciar el arriendo',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  // Método para simular escaneo de QR (en una implementación real usarías una librería de escaneo)
  async simulateQRScan(reservation: any) {
    const loading = await this.loadingCtrl.create({
      message: 'Escaneando código QR...'
    });
    await loading.present();

    // Simular un tiempo de escaneo
    setTimeout(async () => {
      await loading.dismiss();
      
      // Simular un escaneo exitoso
      const alert = await this.alertCtrl.create({
        header: 'Código QR escaneado',
        message: 'El código QR ha sido verificado correctamente.',
        buttons: [
          {
            text: 'Continuar',
            handler: () => {
              this.startRental(reservation);
            }
          }
        ]
      });
      
      await alert.present();
    }, 2000);
  }

  // Método para finalizar un arriendo
  async finishRental(reservation: any) {
    const alert = await this.alertCtrl.create({
      header: 'Finalizar Arriendo',
      message: '¿Estás seguro de que deseas finalizar este arriendo?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Finalizar',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Finalizando arriendo...'
            });
            await loading.present();

            try {
              // Actualizar el estado del arriendo en Firestore
              await this.firebaseSvc.updateDocument(`reservations/${reservation.id}`, {
                rentalActive: false,
                rentalFinished: true,
                rentalEndDate: new Date()
              });

              // Actualizar localmente
              const index = this.reservations.findIndex(r => r.id === reservation.id);
              if (index !== -1) {
                this.reservations[index].rentalActive = false;
                this.reservations[index].rentalFinished = true;
                this.reservations[index].rentalEndDate = new Date();
              }

              await loading.dismiss();

              const toast = await this.toastCtrl.create({
                message: 'Arriendo finalizado con éxito',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
            } catch (error) {
              console.error('Error al finalizar arriendo:', error);
              await loading.dismiss();
              
              const toast = await this.toastCtrl.create({
                message: 'Error al finalizar el arriendo',
                duration: 2000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

 // Método para valorar la experiencia
async rateExperience(reservation: any) {
  let selectedRating = 0;

  const alert = await this.alertCtrl.create({
    header: 'Valorar Experiencia',
    mode: 'ios',
    message: `¿Cómo calificarías tu estancia en ${reservation.publicationTitle}?`,
    inputs: [
      {
        name: 'rating',
        type: 'radio',
        label: '⭐ Muy mala',
        value: '1',
        handler: () => {
          selectedRating = 1;
        }
      },
      {
        name: 'rating',
        type: 'radio',
        label: '⭐⭐ Mala',
        value: '2',
        handler: () => {
          selectedRating = 2;
        }
      },
      {
        name: 'rating',
        type: 'radio',
        label: '⭐⭐⭐ Regular',
        value: '3',
        handler: () => {
          selectedRating = 3;
        }
      },
      {
        name: 'rating',
        type: 'radio',
        label: '⭐⭐⭐⭐ Buena',
        value: '4',
        handler: () => {
          selectedRating = 4;
        }
      },
      {
        name: 'rating',
        type: 'radio',
        label: '⭐⭐⭐⭐⭐ Excelente',
        value: '5',
        handler: () => {
          selectedRating = 5;
        }
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Siguiente',
        handler: () => {
          if (selectedRating === 0) {
            this.showToast('Por favor, selecciona una calificación', 'warning');
            return false; // Evita que se cierre el alert
          }
          
          // Mostrar otro alert para el comentario
          this.askForComment(reservation, selectedRating);
          return true;
        }
      }
    ]
  });

  await alert.present();
}

  // Método para mostrar toast
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      color: color
    });
    await toast.present();
  }

  // Método para pedir comentario
  async askForComment(reservation: any, rating: number) {
    const alert = await this.alertCtrl.create({
      header: 'Comentario (Opcional)',
      inputs: [
        {
          name: 'comment',
          type: 'textarea',
          placeholder: 'Escribe tu comentario aquí...'
        }
      ],
      buttons: [
        {
          text: 'Omitir',
          handler: () => {
            this.submitRating(reservation, rating, '');
          }
        },
        {
          text: 'Enviar',
          handler: (data) => {
            this.submitRating(reservation, rating, data.comment);
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para enviar valoración
  async submitRating(reservation: any, rating: number, comment: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Enviando valoración...'
    });
    await loading.present();

    try {
      // Crear documento de valoración
      await this.firebaseSvc.addDocument('ratings', {
        publicationId: reservation.publicationId,
        reservationId: reservation.id,
        userId: reservation.userId,
        rating: rating,
        comment: comment,
        createdAt: new Date()
      });

      // Marcar la reserva como valorada
      await this.firebaseSvc.updateDocument(`reservations/${reservation.id}`, {
        rated: true
      });

      // Actualizar localmente
      const index = this.reservations.findIndex(r => r.id === reservation.id);
      if (index !== -1) {
        this.reservations[index].rated = true;
      }

      // Actualizar calificación promedio en la publicación
      const ratings = await this.firebaseSvc.getCollectionQuery(
        'ratings',
        'publicationId',
        '==',
        reservation.publicationId
      );

      if (ratings.length > 0) {
        const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / ratings.length;

        await this.firebaseSvc.updateDocument(`publications/${reservation.publicationId}`, {
          averageRating: averageRating,
          ratingCount: ratings.length
        });
      }

      await loading.dismiss();
      this.showToast('Gracias por tu valoración', 'success');
    } catch (error) {
      console.error('Error al enviar valoración:', error);
      await loading.dismiss();
      this.showToast('Error al enviar la valoración', 'danger');
    }
  }
}

