import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { EditPublicationComponent } from '../publicaciones/edit-publication/edit-publication.component';


@Component({
  selector: 'app-publicaciones',
  templateUrl: './publicaciones.page.html',
  styleUrls: ['./publicaciones.page.scss'],
  standalone: false
})
export class PublicacionesPage implements OnInit {
  
  userPublications: any[] = [];
  isLoading: boolean = true;

  constructor(
    private firebaseSvc: FirebaseService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) { }

  async ngOnInit() {
    try {
      this.isLoading = true;
      await this.getUserPublications();
    } finally {
      this.isLoading = false;
    }
  }

  async getUserPublications() {
    const user = await this.firebaseSvc.getAuth().currentUser;
    if (user) {
      const path = 'publications';
      const publications: any[] = await this.firebaseSvc.getCollection(path);
      this.userPublications = publications.filter(pub => pub.userId === user.uid);
    }
  }

  async editPublication(publication: any) {
    const modal = await this.modalCtrl.create({
      component: EditPublicationComponent,
      componentProps: {
        publication: publication
      }
    });
  
    return await modal.present();
  }

  async confirmDelete(publication: any) {
    const alert = await this.alertCtrl.create({
      header: '¿Estás seguro?',
      message: 'Esta acción no se puede deshacer',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deletePublication(publication)
        }
      ]
    });
    await alert.present();
  }

  async deletePublication(publication: any) {
    const loading = await this.loadingCtrl.create({
      message: 'Eliminando publicación...',
      spinner: 'circular'
    });
    await loading.present();
  
    try {
      const path = `publications/${publication.id}`;
      await this.firebaseSvc.deleteDocument(path);
      this.userPublications = this.userPublications.filter(p => p.id !== publication.id);
      
      await loading.dismiss();
      
      const toast = await this.toastCtrl.create({
        message: 'Publicación eliminada exitosamente',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      toast.present();
      
    } catch (error) {
      await loading.dismiss();
      console.log(error);
    }
  }

  async ionViewWillEnter() {
    this.isLoading = true;
    await this.getUserPublications();
    this.isLoading = false;
  }

  goToCreatePublication() {
    this.router.navigate(['main/crear-publicacion']);
  }
}
