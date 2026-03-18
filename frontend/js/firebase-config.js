const firebaseConfig = window.__WOMENLY_FIREBASE_CONFIG__ || {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

function hasPlaceholderFirebaseConfig(config) {
  return Object.keys(config).some(function (key) {
    return typeof config[key] === 'string' && config[key].indexOf('YOUR_') === 0;
  });
}

if (hasPlaceholderFirebaseConfig(firebaseConfig)) {
  console.error(
    'Firebase config is not set. Create frontend/js/firebase-config.local.js using frontend/js/firebase-config.local.example.js and fill real values.'
  );
}

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
