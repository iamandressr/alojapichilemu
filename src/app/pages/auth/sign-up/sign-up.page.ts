import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: false,
})
export class SignUpPage implements OnInit {

  form = new FormGroup({
    uid: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    apellido: new FormControl('', [Validators.required, Validators.minLength(4)]),
    run: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(9)]),
    telefono: new FormControl('', [Validators.required, Validators.minLength(9), Validators.maxLength(9)]),
    rol: new FormControl('cliente'),
  })

  firebaseSvc = inject(FirebaseService)
  utilsSvc = inject(UtilsService)

  ngOnInit() {
  }

  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      const user = this.form.value as User;
      user.rol = 'cliente';  // Added here
      const displayName = `${user.name} ${user.apellido}`;

      this.firebaseSvc.signUp(user).then(async res => {
        await this.firebaseSvc.updateUser(displayName);

        let uid = res.user.uid;
        this.form.controls.uid.setValue(uid);

        this.setUserInfo(uid);
        
      }).catch(error => {
        console.log(error);
        this.utilsSvc.presentToast(error);
        
      }).finally(() => {
        loading.dismiss();
      })
    }
}

  async setUserInfo(uid: string) {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      const user = this.form.value as User;
      const displayName = `${user.name} ${user.apellido}`;

      let path = `users/${uid}`;
      delete this.form.value.password;

      this.firebaseSvc.setDocument(path, this.form.value).then(async res => {

        this.utilsSvc.saveInLocalStorage('user', this.form.value);
        this.utilsSvc.routerLink('/main/home');
        this.form.reset();

      }).catch(error => {
        console.log(error);
        this.utilsSvc.presentToast(error);

      }).finally(() => {
        loading.dismiss();
      })
    }
  }
}
