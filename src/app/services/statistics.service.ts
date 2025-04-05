import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FirebaseService } from './firebase.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  constructor(
    private firestore: AngularFirestore,
    private firebaseSvc: FirebaseService
  ) { }

  // Obtener estadísticas de uso de Firestore
  async getFirestoreStats() {
    try {
      // Contar documentos por colección
      const users = await this.getCollectionCount('users');
      const publications = await this.getCollectionCount('publications');
      const reservations = await this.getCollectionCount('reservations');
      
      console.log('Conteo de usuarios:', users); // Para depuración
      
      // Estimar tamaño de almacenamiento (aproximado)
      const userSize = await this.estimateCollectionSize('users');
      const publicationsSize = await this.estimateCollectionSize('publications');
      const reservationsSize = await this.estimateCollectionSize('reservations');
      
      // Calcular tamaño total en MB
      const totalSizeMB = (userSize + publicationsSize + reservationsSize) / (1024 * 1024);
      
      return {
        documentCounts: {
          users,
          publications,
          reservations,
          total: users + publications + reservations
        },
        storage: {
          usersSizeMB: userSize / (1024 * 1024),
          publicationsSizeMB: publicationsSize / (1024 * 1024),
          reservationsSizeMB: reservationsSize / (1024 * 1024),
          totalSizeMB,
          limitMB: 1024, // 1GB en MB
          usagePercentage: (totalSizeMB / 1024) * 100
        },
        // Estos valores son estimados y deberías implementar contadores reales
        dailyOperations: {
          reads: {
            estimated: users * 2 + publications * 10 + reservations * 3,
            limit: 50000,
          },
          writes: {
            estimated: 50, // Valor estimado
            limit: 20000,
          },
          deletes: {
            estimated: 10, // Valor estimado
            limit: 20000,
          }
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // Contar documentos en una colección - Método actualizado
  private async getCollectionCount(collectionName: string): Promise<number> {
    try {
      // Usando el método de FirebaseService que ya tienes
      const documents = await this.firebaseSvc.getCollection(collectionName);
      return documents.length;
      
      // Alternativa si prefieres usar directamente AngularFirestore
      // const snapshot = await firstValueFrom(this.firestore.collection(collectionName).get());
      // return snapshot.size;
    } catch (error) {
      console.error(`Error al contar documentos en ${collectionName}:`, error);
      return 0;
    }
  }

  // Estimar tamaño de una colección (en bytes) - Método actualizado
  private async estimateCollectionSize(collectionName: string): Promise<number> {
    try {
      // Usando el método de FirebaseService
      const documents = await this.firebaseSvc.getCollection(collectionName);
      
      let totalSize = 0;
      
      documents.forEach(doc => {
        // Convertir el documento a string y medir su longitud
        const docData = JSON.stringify(doc);
        totalSize += docData.length;
      });
      
      // Añadir overhead por metadatos (aproximado)
      totalSize += documents.length * 200;
      
      return totalSize;
    } catch (error) {
      console.error(`Error al estimar tamaño de ${collectionName}:`, error);
      return 0;
    }
  }
}
