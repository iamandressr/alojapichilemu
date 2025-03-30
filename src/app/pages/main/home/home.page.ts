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
  filteredPublications: any[] = []; // Para almacenar las publicaciones filtradas
  isLoading: boolean = true;
  selectedLocation: string = 'todas'; // Valor por defecto para mostrar todas las publicaciones

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
    console.log('Publicaciones obtenidas:', this.publications);
    
    // Aplicar filtro inicial
    this.applyFilter();
  }

  // Método para aplicar el filtro según la ubicación seleccionada
  applyFilter() {
    console.log('Aplicando filtro para ubicación:', this.selectedLocation);
    
    if (this.selectedLocation === 'todas') {
      this.filteredPublications = [...this.publications];
    } else {
      this.filteredPublications = this.publications.filter(pub => {
        const locationMatches = pub.location && 
                               pub.location.toLowerCase() === this.selectedLocation.toLowerCase();
        console.log(`Publicación ${pub.title} - ubicación: ${pub.location} - coincide: ${locationMatches}`);
        return locationMatches;
      });
    }
    
    console.log('Publicaciones filtradas:', this.filteredPublications);
  }

  // Método para cambiar el filtro
  onLocationChange(event: any) {
    console.log('Cambio de ubicación detectado:', event.detail.value);
    this.selectedLocation = event.detail.value;
    this.applyFilter();
  }

  goToPublicationDetail(publication: any) {
    this.router.navigate(['/main/detalle-publicacion', publication.id]);
  }

  ionViewWillEnter() {
    // Recargar publicaciones cada vez que se entra a la página
    this.getPublications();
  }
}
