import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { register } from 'swiper/element';

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
  ) { }

  async ngOnInit() {
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

  async checkIfUserIsAdmin() {
    try {
      // Obtener el usuario actual - usando await ya que es una promesa
      const auth = this.firebaseSvc.getAuth();
      
      // Obtener el usuario actual de forma segura
      let currentUser: any = null;
      
      try {
        // Si auth.currentUser es una promesa, usamos await
        currentUser = await auth.currentUser;
      } catch (e) {
        // Si no es una promesa y causa error, intentamos acceder directamente
        currentUser = auth.currentUser;
      }
      
      if (currentUser && currentUser.uid) {
        // Obtener el rol del usuario
        const userData: any = await this.firebaseSvc.getDocument(`users/${currentUser.uid}`);
        this.isAdmin = userData && userData["rol"] === 'admin';
      } else {
        this.isAdmin = false;
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
}
