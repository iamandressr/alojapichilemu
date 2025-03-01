import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-edit-publication',
  templateUrl: './edit-publication.component.html',
  styleUrls: ['./edit-publication.component.scss'],
  standalone: false
})
export class EditPublicationComponent implements OnInit {
  @Input() publication: any;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
    console.log('Publicación a editar:', this.publication);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
