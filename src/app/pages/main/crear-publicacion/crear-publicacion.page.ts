import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Router } from '@angular/router';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

import { LoadingController } from '@ionic/angular';



@Component({
  selector: 'app-crear-publicacion',
  templateUrl: './crear-publicacion.page.html',
  styleUrls: ['./crear-publicacion.page.scss'],
  standalone: false
})
export class CrearPublicacionPage implements OnInit {
  publicationForm: FormGroup;
  userData: any = {};
  selectedImages: any[] = [];

  constructor(
    private fb: FormBuilder,
    private firebaseSvc: FirebaseService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private router: Router,
    private loadingCtrl: LoadingController
  ) {
    this.createForm();
  }

  async ngOnInit() {
    const user = await this.firebaseSvc.getAuth().currentUser;
    if (user) {
      const path = `users/${user.uid}`;
      this.userData = await this.firebaseSvc.getDocument(path);
      console.log('User data loaded:', this.userData);
    }
  }

  createForm() {
    this.publicationForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', Validators.required],
      location: ['', Validators.required],
      capacity: ['', Validators.required],
      estacionamiento: ['', Validators.required]
    });
  }

  handleImageUpload(event: any) {
    const files = event.target.files;
    console.log('Número de archivos seleccionados:', files.length);
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImages.push({
          file: files[i],
          preview: e.target.result,
          dataUrl: e.target.result // Guardar el dataUrl para subirlo después
        });
      };
      reader.readAsDataURL(files[i]);
    }
  }
  

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
  }

  async createPublication() {
    if (this.publicationForm.valid && this.selectedImages.length > 0) {
      const loading = await this.loadingCtrl.create({
        message: 'Creando publicación...',
        spinner: 'circular'
      });
      await loading.present();
  
      try {
        const imageUrls = this.selectedImages.map(img => img.preview);
        const data = {
          ...this.publicationForm.value,
          userId: this.userData?.uid || '',
          userName: this.userData?.name || '',
          userLastName: this.userData?.apellido || '',
          userEmail: this.userData?.email || '',
          userPhone: this.userData?.telefono || '',  
          createdAt: new Date(),
          availability: true,
          images: imageUrls
        };
  
        const path = 'publications';
        await this.firebaseSvc.addDocument(path, data);
        await loading.dismiss();
  
        const toast = await this.toastCtrl.create({
          message: 'Publicación creada exitosamente',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        toast.present();
        
        this.router.navigate(['/main/publicaciones']);
      } catch (error) {
        await loading.dismiss();
        console.log('Error:', error);
      }
    }
  }

  goBack() {
    this.navCtrl.back();
  }
  
}   
