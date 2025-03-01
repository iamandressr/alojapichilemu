import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-detalle-publicacion',
  templateUrl: './detalle-publicacion.page.html',
  styleUrls: ['./detalle-publicacion.page.scss'],
  standalone: false
})
export class DetallePublicacionPage implements OnInit {

  publication: any;
  isLoading: boolean = true;

  slideOpts = {
    zoom: false,
    slidesPerView: 1,
    spaceBetween: 0,
    centeredSlides: true
  };

  constructor(private route: ActivatedRoute,
    private firebaseSvc: FirebaseService) { }

    async ngOnInit() {
      try {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          const path = `publications/${id}`;
          this.publication = await this.firebaseSvc.getDocument(path);
        }
      } finally {
        this.isLoading = false;
      }
  }

}
