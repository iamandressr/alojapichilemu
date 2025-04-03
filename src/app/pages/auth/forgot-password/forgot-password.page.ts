import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';


@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false,
})
export class ForgotPasswordPage implements OnInit {
  resetForm: FormGroup;
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private firebaseSvc: FirebaseService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router
  ) { }

  ngOnInit() {
    this.setupForm();
  }

  setupForm() {
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async resetPassword() {
    if (this.resetForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const email = this.resetForm.get('email').value;

    const loading = await this.loadingCtrl.create({
      message: 'Enviando correo de recuperación...',
      mode: 'ios',
      spinner: 'circular'
    });
    await loading.present();

    try {
      await this.firebaseSvc.resetPassword(email);
      await loading.dismiss();
      this.isSubmitting = false;
      
      // Mostrar alerta de éxito
      const alert = await this.alertCtrl.create({
        header: 'Correo enviado',
        message: `Hemos enviado un correo a ${email} con instrucciones para restablecer tu contraseña.`,
        mode: 'ios',
        buttons: [
          {
            text: 'Volver al inicio de sesión',
            handler: () => {
              this.router.navigate(['/auth']);
            }
          }
        ]
      });
      await alert.present();
    } catch (error) {
      await loading.dismiss();
      this.isSubmitting = false;
      
      let errorMessage = 'Ha ocurrido un error. Inténtalo de nuevo.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido.';
      }
      
      const toast = await this.toastCtrl.create({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        mode: 'ios',
        position: 'bottom'
      });
      toast.present();
    }
  }

  goBack() {
    this.router.navigate(['/auth']);
  }

}
