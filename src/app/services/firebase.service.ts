import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { query, where } from 'firebase/firestore';


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
    this.auth.setPersistence('local');
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
  
      // Guardar información de sesión en localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: credentials.user.uid,
        email: credentials.user.email,
        // Otros datos que necesites
      }));
  
      return credentials;
    } catch (error) {
      throw error;
    }
  }

async checkAuthState() {
  return new Promise((resolve, reject) => {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        resolve(user);
      } else {
        // Intentar restaurar desde localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          resolve(JSON.parse(savedUser));
        } else {
          resolve(null);
        }
      }
    }, reject);
  });
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
    return getAuth();
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
  
      // Usar el método nativo de Firebase en lugar de AngularFirestore
      const docRef = doc(getFirestore(), path);
      await updateDoc(docRef, data);
  
      console.log('Documento actualizado con éxito');
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    return new Promise((resolve, reject) => {
      const auth = this.getAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      }, reject);
    });
  }

  async getCollectionQuery(path: string, field: string, operator: any, value: any) {
    try {
      const db = getFirestore();
      const collectionRef = collection(db, path);
      const q = query(collectionRef, where(field, operator, value));
      const querySnapshot = await getDocs(q);
      
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return docs;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async resetPassword(email: string) {
    try {
      return await this.auth.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
      throw error;
    }
  }
  
}
