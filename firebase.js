// firebase.js
import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDgnGmUEKxCKhpSfXDioroFBUMuQ7gZQek",
  authDomain: "todo-app-1496b.firebaseapp.com",
  projectId: "todo-app-1496b",
  storageBucket: "todo-app-1496b.appspot.com",
  messagingSenderId: "69499012502",
  appId: "1:69499012502:web:5d3eceb3254b34dbf709b7"
};

// ✅ Initialize ONLY ONCE
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Export services
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Make global (for todo.js)
window.db = db;
window.auth = auth;
