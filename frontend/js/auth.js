function showAlert(msg, type) {
  const el = document.getElementById('authAlert');
  el.innerHTML = '<div class="alert alert-' + type + '">' + msg + '</div>';
}

function getAuthErrorMessage(err) {
  const code = err && err.code ? err.code : 'unknown';
  let msg = 'Google sign-in failed. Please try again.';

  if (code === 'auth/popup-closed-by-user') msg = 'Sign-in popup closed before completion.';
  if (code === 'auth/popup-blocked') msg = 'Popup blocked by browser. Retrying with redirect sign-in.';
  if (code === 'auth/operation-not-allowed') msg = 'Google provider is disabled in Firebase Authentication.';
  if (code === 'auth/unauthorized-domain') msg = 'This domain is not authorized in Firebase.';
  if (code === 'auth/operation-not-supported-in-this-environment') msg = 'This environment is not supported for Google login. Use an http/https URL.';
  if (code === 'auth/network-request-failed') msg = 'Network error while contacting Firebase. Check internet and retry.';
  if (code === 'auth/invalid-api-key') msg = 'Firebase API key is invalid or restricted.';
  if (code === 'auth/app-not-authorized') msg = 'This app is not authorized for Firebase Authentication.';
  if (code === 'auth/configuration-not-found') msg = 'Google sign-in is not configured in Firebase Authentication.';

  return msg + ' (Error: ' + code + ')';
}

function hasWebOrigin() {
  return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

if (!hasWebOrigin()) {
  showAlert('Google login requires an http/https URL. Opening via file:// is not supported.', 'error');
}

async function signInWithGoogle(e) {
  e.preventDefault();

  if (!hasWebOrigin()) {
    showAlert('Google login requires an http/https URL. Please open this app via a web server or deployed URL.', 'error');
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    let cred;
    try {
      cred = await auth.signInWithPopup(provider);
    } catch (popupErr) {
      if (
        popupErr.code === 'auth/popup-blocked' ||
        popupErr.code === 'auth/cancelled-popup-request'
      ) {
        await auth.signInWithRedirect(provider);
        return;
      }
      throw popupErr;
    }

    const user = cred.user;

    if (user) {
      try {
        await db.collection('users').doc(user.uid).set({
          name: user.displayName || 'User',
          email: user.email || '',
          photoURL: user.photoURL || '',
          provider: 'google',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (profileErr) {
        console.warn('Profile sync warning:', profileErr.code, profileErr.message);
      }
    }

    showAlert('Signed in with Google! Redirecting...', 'success');
    setTimeout(function () {
      window.location.href = 'dashboard.html';
    }, 1000);
  } catch (err) {
    showAlert(getAuthErrorMessage(err), 'error');
    console.error('Google sign-in error:', err.code, err.message);
  }
}

auth.getRedirectResult().catch(function(err) {
  showAlert(getAuthErrorMessage(err), 'error');
  console.error('Redirect sign-in error:', err.code, err.message);
});

// Redirect if already logged in
auth.onAuthStateChanged(function (user) {
  if (user) {
    window.location.href = 'dashboard.html';
  }
});
