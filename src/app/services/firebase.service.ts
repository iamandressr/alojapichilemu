import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getFirestore, Firestore, deleteDoc, setDoc, doc, getDoc, collection, getDocs, updateDoc } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private storageConfig = {
    maxOperationRetryTime: 10000,
    customDomain: true,
    cors: {
      origin: ['*'],
      methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type']
    }
  };

  constructor(private storage: AngularFireStorage ) {

   }

  auth = inject(AngularFireAuth)
  firestore = inject(AngularFirestore)



  // Autenticacion
  async signIn(user: User) {
    try {
      const credentials = await signInWithEmailAndPassword(getAuth(), user.email, user.password);
      const uid = credentials.user.uid;
      const path = `users/${uid}`;
      const userData = await this.getDocument(path);

      if (!userData['enabled']) {
        throw new Error('Usuario deshabilitado');
      }

      return credentials;
    } catch (error) {
      throw error;
    }
  }


  // Registro
  async signUp(user: User) {
    const credentials = await createUserWithEmailAndPassword(getAuth(), user.email, user.password);

    const userData = {
      uid: credentials.user.uid,
      email: user.email,
      password: user.password,
      name: user.name,
      apellido: user.apellido,
      telefono: user.telefono,
      run: user.run,
      rol: 'cliente',
      enabled: true
    }

    const path = `users/${credentials.user.uid}`;
    await this.setDocument(path, userData);

    return credentials;
  }


  //Actualizar perfil
  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, {displayName})
  }


  // Base de datos
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }

  // Get document
  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }

  getAuth() {
    return this.auth;
  }

  async getCollection(path: string) {
    const querySnapshot = await getDocs(collection(getFirestore(), path));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  }

  async addDocument(path: string, data: any) {
    const collectionRef = collection(getFirestore(), path);
    const newDoc = doc(collectionRef);
    data.id = newDoc.id;
    await setDoc(newDoc, data);
    return data;
  }

  async uploadImage(file: File, path: string): Promise<string> {
    const storageRef = this.storage.ref(path);
    const task = storageRef.put(file);

    return new Promise((resolve, reject) => {
      task.then(async snapshot => {
        const downloadUrl = await snapshot.ref.getDownloadURL();
        resolve(downloadUrl);
      }).catch(error => reject(error));
    });
  }

  async deleteDocument(path: string) {
    try {
      const docRef = doc(getFirestore(), path);
      return await deleteDoc(docRef);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Añade este método a tu FirebaseService si no existe
  async updateDocument(path: string, data: any) {
    try {
      console.log('Intentando actualizar documento en:', path);
      console.log('Datos a actualizar:', data);

      // Si estás usando AngularFirestore
      await this.firestore.doc(path).update(data);

      console.log('Documento actualizado con éxito');
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      return false;
    }
  }



}
