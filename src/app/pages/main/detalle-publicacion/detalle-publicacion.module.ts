import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DetallePublicacionPageRoutingModule } from './detalle-publicacion-routing.module';

import { DetallePublicacionPage } from './detalle-publicacion.page';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetallePublicacionPageRoutingModule,
    SharedModule
  ],
  declarations: [DetallePublicacionPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DetallePublicacionPageModule {}
