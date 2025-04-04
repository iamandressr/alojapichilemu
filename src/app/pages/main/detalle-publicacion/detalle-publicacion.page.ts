import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { register } from 'swiper/element';
import { Reservation } from 'src/app/models/reservation.model';

register();

@Component({
  selector: 'app-detalle-publicacion',
  templateUrl: './detalle-publicacion.page.html',
  styleUrls: ['./detalle-publicacion.page.scss'],
  standalone: false
})
export class DetallePublicacionPage implements OnInit {
  publication: any;
  isLoading: boolean = true;
  isAdmin: boolean = false;
  userActive: boolean = false;
  currentUser: any = null;

  // Propiedades para reservas
  showReservationCalendar: boolean = false;
  startDate: string;
  endDate: string;
  minDate: string = new Date().toISOString();
  maxDate: string = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();
  totalPrice: number = 0;

  slideOpts = {
    initialSlide: 0,
    speed: 400,
    loop: true,
    autoplay: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseSvc: FirebaseService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    
    try {
      // Verificar si el usuario actual es administrador
      await this.checkIfUserIsAdmin();
      
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        const path = `publications/${id}`;
        this.publication = await this.firebaseSvc.getDocument(path);
        
        // Si el usuario es administrador, verificar si el autor de la publicación existe
        if (this.isAdmin && this.publication) {
          await this.checkIfAuthorExists();
        }
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async ionViewWillEnter() {
    console.log('ionViewWillEnter - Verificando autenticación...');
    
    // Esperar un momento para asegurarse de que la autenticación se inicialice
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Volver a verificar el rol de administrador cada vez que se entra a la página
    await this.checkIfUserIsAdmin();
    console.log('ionViewWillEnter - isAdmin:', this.isAdmin);
    
    // Si el usuario es administrador y la publicación está cargada, verificar el estado del autor
    if (this.isAdmin && this.publication) {
      await this.checkIfAuthorExists();
      console.log('ionViewWillEnter - userActive:', this.userActive);
    }
  }

  async checkIfUserIsAdmin() {
    try {
      // Establecer valor predeterminado
      this.isAdmin = false;
      
      // Obtener el usuario actual
      const auth = this.firebaseSvc.getAuth();
      
      // Manejar correctamente currentUser, que podría ser una promesa
      let currentUser = null;
      
      if (auth.currentUser instanceof Promise) {
        currentUser = await auth.currentUser;
      } else {
        currentUser = auth.currentUser;
      }
      
      if (!currentUser || !currentUser.uid) {
        console.log('No hay usuario autenticado');
        this.isAdmin = false;
        return;
      }
      
      // Obtener el rol del usuario
      const userData: any = await this.firebaseSvc.getDocument(`users/${currentUser.uid}`);
      
      if (!userData) {
        console.log('No se encontraron datos de usuario');
        this.isAdmin = false;
        return;
      }
      
      // Verificar si el rol es admin
      if (userData["rol"] === 'admin') {
        this.isAdmin = true;
        console.log('Usuario es administrador');
      } else {
        this.isAdmin = false;
        console.log('Usuario no es administrador');
      }
    
    } catch (error) {
      console.error('Error al verificar rol de usuario:', error);
      this.isAdmin = false;
    }
  }

  async checkIfAuthorExists() {
    try {
      if (this.publication && this.publication.userId) {
        // Verificar si el usuario existe en la base de datos
        const userData = await this.firebaseSvc.getDocument(`users/${this.publication.userId}`);
        this.userActive = !!userData; // Convertir a booleano
      } else {
        this.userActive = false;
      }
    } catch (error) {
      console.error('Error al verificar existencia del autor:', error);
      this.userActive = false;
    }
  }

  async deletePublication() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      mode: 'ios',
      message: '¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.confirmDeletePublication();
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmDeletePublication() {
    try {
      const loading = await this.loadingCtrl.create({
        message: 'Eliminando publicación...'
      });
      await loading.present();
      // Eliminar la publicación
      const path = `publications/${this.publication.id}`;
      await this.firebaseSvc.deleteDocument(path);
      await loading.dismiss();
      // Mostrar mensaje de éxito
      const toast = await this.toastCtrl.create({
        message: 'Publicación eliminada correctamente',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      // Navegar de vuelta a la página anterior
      this.router.navigate(['/main/home']);
    } catch (error) {
      console.error('Error al eliminar la publicación:', error);
      
      // Mostrar mensaje de error
      const toast = await this.toastCtrl.create({
        message: 'Error al eliminar la publicación',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  // Métodos para reservas
  showReservationModal() {
    this.showReservationCalendar = true;
  }

  cancelReservation() {
    this.showReservationCalendar = false;
    this.startDate = null;
    this.endDate = null;
    this.totalPrice = 0;
  }

  calculateDuration() {
    if (!this.startDate || !this.endDate) return 0;
    
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  calculateTotalPrice() {
    const duration = this.calculateDuration();
    this.totalPrice = duration * this.publication.price;
  }

  isValidReservation() {
    return this.startDate && this.endDate && this.calculateDuration() > 0 && !this.hasOverlappingReservation();
  }

  hasOverlappingReservation() {
    if (!this.publication.bookedDates || !this.startDate || !this.endDate) return false;
    
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    return this.publication.bookedDates.some(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      return (
        (start >= bookingStart && start <= bookingEnd) ||
        (end >= bookingStart && end <= bookingEnd) ||
        (start <= bookingStart && end >= bookingEnd)
      );
    });
  }

  async confirmReservation() {
    if (!this.isValidReservation()) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor selecciona fechas válidas para tu reserva',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }
    
    try {
      const loading = await this.loadingCtrl.create({
        message: 'Procesando reserva...'
      });
      await loading.present();
      
      // Obtener el usuario actual
      const currentUser: any = await this.firebaseSvc.getCurrentUser();
      
      if (!currentUser) {
        await loading.dismiss();
        throw new Error('Debes iniciar sesión para realizar una reserva');
      }
      
      // Obtener datos del usuario
      const userData: any = await this.firebaseSvc.getDocument(`users/${currentUser.uid}`);
      
      if (!userData) {
        await loading.dismiss();
        throw new Error('No se encontraron datos de usuario');
      }
      
      // Crear objeto de reserva
      const reservation: Reservation = {
        publicationId: this.publication.id,
        userId: currentUser.uid,
        userName: `${userData["name"]} ${userData["apellido"]}`,
        userEmail: userData["email"],
        userPhone: userData["telefono"],
        userRun: userData["run"] || '', // Obtener el RUN del perfil del usuario
        startDate: new Date(this.startDate),
        endDate: new Date(this.endDate),
        totalPrice: this.totalPrice,
        status: 'pending',
        createdAt: new Date()
      };
      
      // Guardar la reserva en Firestore
      const reservationId = await this.firebaseSvc.addDocument('reservations', reservation);
      
      // Actualizar las fechas reservadas en la publicación
      if (!this.publication.bookedDates) {
        this.publication.bookedDates = [];
      }
      
      this.publication.bookedDates.push({
        startDate: new Date(this.startDate),
        endDate: new Date(this.endDate)
      });
      
      await this.firebaseSvc.updateDocument(`publications/${this.publication.id}`, {
        bookedDates: this.publication.bookedDates
      });
      
      await loading.dismiss();
      
      // Mostrar mensaje de éxito
      const toast = await this.toastCtrl.create({
        message: 'Reserva realizada con éxito',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
      // Cerrar el modal
      this.cancelReservation();
      
    } catch (error) {
      console.error('Error al realizar la reserva:', error);
      
      const toast = await this.toastCtrl.create({
        message: error.message || 'Error al realizar la reserva',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  // Métodos para formatear fechas y manejar cambios en el calendario
  formatDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  onStartDateChange(event: any) {
    this.startDate = event.detail.value;
    // Si la fecha de salida es anterior a la de llegada, ajustarla
    if (this.endDate && new Date(this.endDate) <= new Date(this.startDate)) {
      // Establecer la fecha de salida al día siguiente de la llegada
      const nextDay = new Date(this.startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      this.endDate = nextDay.toISOString();
    }
    this.calculateTotalPrice();
  }

  onEndDateChange(event: any) {
    this.endDate = event.detail.value;
    this.calculateTotalPrice();
  }

  formatLocation(location: string): string {
    switch(location) {
      case 'punta-de-lobos':
        return 'Punta de Lobos';
      case 'pichilemu':
        return 'Pichilemu';
      case 'cahuil':
        return 'Cahuil';
      default:
        return location;
    }
  }
}
