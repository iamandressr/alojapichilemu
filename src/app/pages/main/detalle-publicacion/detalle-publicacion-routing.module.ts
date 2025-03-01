import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetallePublicacionPage } from './detalle-publicacion.page';

const routes: Routes = [
  {
    path: '',
    component: DetallePublicacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetallePublicacionPageRoutingModule {}
