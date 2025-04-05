import { Component, OnInit } from '@angular/core';
import { StatisticsService } from 'src/app/services/statistics.service';
import { LoadingController } from '@ionic/angular';


@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.page.html',
  styleUrls: ['./estadisticas.page.scss'],
  standalone: false, 
})
export class EstadisticasPage implements OnInit {
  stats: any = null;
  isLoading: boolean = true;
  error: string = null;

  constructor(
    private statsSvc: StatisticsService,
    private loadingCtrl: LoadingController
  ) { }

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando estadísticas...'
    });
    await loading.present();

    try {
      this.stats = await this.statsSvc.getFirestoreStats();
      this.error = null;
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      this.error = 'No se pudieron cargar las estadísticas. Por favor, intenta nuevamente.';
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  // Función para formatear números grandes
  formatNumber(num: number): string {
    return num.toLocaleString('es-CL');
  }

  // Función para obtener color según el porcentaje de uso
  getUsageColor(percentage: number): string {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'danger';
  }

}
