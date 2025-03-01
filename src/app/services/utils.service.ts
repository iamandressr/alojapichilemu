import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, ToastOptions, IonicSafeString } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  loadingCtrl = inject(LoadingController);
  toastCtrl = inject(ToastController);
  router = inject(Router);

  // Loading
  loading() {
    return this.loadingCtrl.create({
      spinner: 'crescent',
    })
  }

  // Toast
  async presentToast(error: any) {
    const toast = await this.toastCtrl.create({
      icon: 'alert-circle-outline',
      position: 'middle',
      duration: 3000,
      color: 'primary',
      message: this.getErrorMessage(error)
    });
    toast.present();
  }

  private getErrorMessage(error: any): string {
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-credential': 'Correo o contraseña incorrectos. Por favor, verifica tus datos.',
      'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
      'auth/wrong-password': 'La contraseña es incorrecta.',
      'auth/email-already-in-use': 'Este correo electrónico ya está registrado.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/invalid-email': 'El formato del correo electrónico no es válido.',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.'
    };

    if (error?.code) {
      return errorMessages[error.code] || 'Ha ocurrido un error. Intenta nuevamente.';
    }

    return 'Ha ocurrido un error. Intenta nuevamente.';
  }

  routerLink(url: string) {
    return this.router.navigateByUrl(url);
  }

  saveInLocalStorage(key: string, value: any) {
    return localStorage.setItem(key, JSON.stringify(value));
  }

  getFromLocalStorage(key: string) {
    return JSON.parse(localStorage.getItem(key)) 
  }
}
