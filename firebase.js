// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDremaHQPTdxI-KKVaXhcNOx5iAvTMyvnc",
  authDomain: "vmh-counter.firebaseapp.com",
  databaseURL:
    "https://vmh-counter-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vmh-counter",
  storageBucket: "vmh-counter.firebasestorage.app",
  messagingSenderId: "816931040448",
  appId: "1:816931040448:web:9058c4c95aa062bcf61125",
  measurementId: "G-YGC7YVX4TL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };
