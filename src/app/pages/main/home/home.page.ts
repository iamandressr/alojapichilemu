import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { getAuth } from 'firebase/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  user: any;
  userData: any = {};
  publications: any[] = [];
  isLoading: boolean = true;

  constructor(private firebaseSvc: FirebaseService, private router: Router) { }

  async ngOnInit() {
    this.isLoading = true;
    try {
      const auth = getAuth();
      this.user = auth.currentUser;
      await this.getPublications();
      
      if(this.user) {
        const path = `users/${this.user.uid}`;
        this.userData = await this.firebaseSvc.getDocument(path);
      }
    } finally {
      this.isLoading = false;
    }
  }

  async getPublications() {
    const path = 'publications';
    this.publications = await this.firebaseSvc.getCollection(path);
    console.log('Publicaciones con imágenes:', this.publications);
    this.publications.forEach(pub => {
      console.log('URLs de imágenes:', pub.images);
    });
  }

  goToPublicationDetail(publication: any) {
    this.router.navigate(['/main/detalle-publicacion', publication.id]);
  }

  ionViewWillEnter() {
    this.getPublications(); 
  }
  
}
