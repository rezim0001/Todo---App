// auth.js
import {
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase already initialized in firebase.js
const auth = window.auth;

// Safety check
if (!auth) {
  console.error("❌ Firebase Auth not initialized");
}

// Auto anonymous login
onAuthStateChanged(auth, user => {
  if (user) {
    window.userId = user.uid;
    console.log("✅ Logged in as:", user.uid);
  } else {
    signInAnonymously(auth)
      .then(res => {
        window.userId = res.user.uid;
        console.log("✅ Anonymous login:", res.user.uid);
      })
      .catch(err => console.error(err));
  }
});
