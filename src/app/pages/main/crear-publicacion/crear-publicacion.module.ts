import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CrearPublicacionPageRoutingModule } from './crear-publicacion-routing.module';

import { CrearPublicacionPage } from './crear-publicacion.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CrearPublicacionPageRoutingModule,
    SharedModule
  ],
  declarations: [CrearPublicacionPage]
})
export class CrearPublicacionPageModule {}
