// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, onValue, set } from 'firebase/database'; 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPVUv6tp1PInYATgwoP1uPBvHRGalfhz8",
  authDomain: "whiteboard-9ce8f.firebaseapp.com",
  databaseURL: "https://whiteboard-9ce8f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whiteboard-9ce8f",
  storageBucket: "whiteboard-9ce8f.firebasestorage.app",
  messagingSenderId: "1040286509048",
  appId: "1:1040286509048:web:951ae651bf17096f99180d",
  measurementId: "G-27GR77Y96M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const analytics = getAnalytics(app);
export { db};
