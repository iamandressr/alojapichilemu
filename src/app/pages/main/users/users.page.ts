import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { EdituserComponent } from './edituser/edituser.component';




@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: false
})
export class UsersPage implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  selectedRole: string = 'todos';
  selectedStatus: string = 'todos';
  isLoading: boolean = true;

  constructor(
    private firebaseSvc: FirebaseService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) { }

  async ngOnInit() {
    try {
      this.isLoading = true;
      // Tu lógica actual de carga de usuarios
      await this.getUsers();
    } finally {
      this.isLoading = false;
    }
  }

  async getUsers() {
    const path = 'users';
    this.users = await this.firebaseSvc.getCollection(path);
    this.filteredUsers = [...this.users]; // Inicializamos con todos los usuarios
  }

  segmentChanged(event: any) {
    console.log('Rol seleccionado:', event.detail.value);
    this.selectedRole = event.detail.value;
    this.applyFilters();
  }

  statusChanged(event: any) {
    console.log('Estado seleccionado:', event.detail.value);
    this.selectedStatus = event.detail.value;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.users];
    console.log('Aplicando filtros:', this.selectedRole, this.selectedStatus);

    if (this.selectedRole !== 'todos') {
      filtered = filtered.filter(user => user.rol === this.selectedRole);
    }

    if (this.selectedStatus === 'enabled') {
      filtered = filtered.filter(user => user.enabled === true);
    } else if (this.selectedStatus === 'disabled') {
      filtered = filtered.filter(user => user.enabled === false);
    }

    this.filteredUsers = filtered;
    console.log('Usuarios filtrados:', this.filteredUsers);
  }

  searchByRun(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (searchTerm === '') {
      this.applyFilters(); // Si el búscador está vacío, aplicamos solo los filtros
      return;
    }
  
    // Aplicamos búsqueda sobre los usuarios ya filtrados
    this.filteredUsers = this.users.filter(user => {
      const runMatch = user.run.toLowerCase().includes(searchTerm);
      const roleMatch = this.selectedRole === 'todos' || user.rol === this.selectedRole;
      const statusMatch = this.selectedStatus === 'todos' || 
        (this.selectedStatus === 'enabled' && user.enabled) || 
        (this.selectedStatus === 'disabled' && !user.enabled);
      
      return runMatch && roleMatch && statusMatch;
    });
  }

  async editUser(user: any) {
    const modal = await this.modalCtrl.create({
      component: EdituserComponent,
      componentProps: {
        user: {...user}
      },
      mode: 'ios'
    });
  
    await modal.present();
  
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.getUsers(); // Recarga los usuarios si recibimos data
    }
  }
  

  async confirmToggleUser(user: any) {
    const action = user.enabled ? 'deshabilitar' : 'habilitar';
    
    const alert = await this.alertCtrl.create({
      header: `${action.charAt(0).toUpperCase() + action.slice(1)} Usuario`,
      message: `¿Está seguro que desea ${action} este usuario?`,
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: `Sí, ${action}`,
          handler: () => {
            this.toggleUserState(user);
          }
        }
      ]
    });
  
    await alert.present();
  }
  
  async toggleUserState(user: any) {
    const path = `users/${user.id}`;
    user.enabled = !user.enabled;
    await this.firebaseSvc.setDocument(path, user);
    
    const message = user.enabled ? 'Usuario habilitado exitosamente' : 'Usuario deshabilitado exitosamente';
    
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: user.enabled ? 'success' : 'danger',
      mode: 'ios'
    });
    
    await toast.present();
    this.getUsers();
  }

  
  
}
