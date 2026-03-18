// Firebase configuration — replace with your project keys
const firebaseConfig = {
  apiKey: "AIzaSyAfXtWDF6iOMVK373xdeE13RDgwZkg7wOE",
  authDomain: "womenly-b0665.firebaseapp.com",
  projectId: "womenly-b0665",
  storageBucket: "womenly-b0665.firebasestorage.app",
  messagingSenderId: "36557330231",
  appId: "1:36557330231:web:00fba85eec2c9518302cb2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
