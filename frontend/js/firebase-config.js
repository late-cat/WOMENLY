const firebaseConfig = window.__WOMENLY_FIREBASE_CONFIG__ || {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

function hasPlaceholderFirebaseConfig(config) {
  return !config.apiKey || config.apiKey.startsWith('YOUR_');
}

if (hasPlaceholderFirebaseConfig(firebaseConfig)) {
  console.warn(
    'Womenly: Firebase placeholders detected. Google Login will not work until you replace YOUR_API_KEY etc.'
  );
}

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
