import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  slideOpts = {
    initialSlide: 0,
    speed: 400,
    loop: true,
    autoplay: false
  };

  constructor(
    private route: ActivatedRoute,
    private firebaseSvc: FirebaseService
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
}
