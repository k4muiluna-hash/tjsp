// firebase-config.js - Versão para navegador
const firebaseConfig = {
  apiKey: "AIzaSyCFxn_-gvviq6Pss-lDaXEwWDyZHVxGo5U",
  authDomain: "tj-convoc.firebaseapp.com",
  databaseURL: "https://tj-convoc-default-rtdb.firebaseio.com",
  projectId: "tj-convoc",
  storageBucket: "tj-convoc.firebasestorage.app",
  messagingSenderId: "407268963912",
  appId: "1:407268963912:web:5eb2ae2933bb520d370a7d",
  measurementId: "G-NTM9BDZFBH"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Referência para os dados no Realtime Database
const cidadesRef = database.ref('/'); // Raiz do seu banco

console.log("✅ Firebase conectado ao Realtime Database");