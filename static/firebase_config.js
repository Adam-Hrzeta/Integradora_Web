// firebase_config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDb_ku8kOZgdmwvXhymO6FkLCAY5nEiZE0",
  authDomain: "parkingtech-99936.firebaseapp.com",
  projectId: "parkingtech-99936",
  storageBucket: "parkingtech-99936.firebasestorage.app",
  messagingSenderId: "964197580459",
  appId: "1:964197580459:web:6ec8e3127f0543ade341ee",
  measurementId: "G-KZJLNGH0WY",
  databaseURL: "https://parkingtech-99936-default-rtdb.firebaseio.com"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { auth, db, rtdb, storage };