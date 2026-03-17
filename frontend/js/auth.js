let isSignUp = false;

function toggleMode(e) {
  e.preventDefault();
  isSignUp = !isSignUp;

  document.getElementById('authTitle').textContent = isSignUp ? 'Create Account' : 'Welcome Back';
  document.getElementById('authSubtitle').textContent = isSignUp
    ? 'Sign up to start tracking your health'
    : 'Sign in to access your health dashboard';
  document.getElementById('authBtn').textContent = isSignUp ? 'Sign Up' : 'Sign In';
  document.getElementById('toggleText').textContent = isSignUp
    ? 'Already have an account?'
    : "Don't have an account?";
  document.getElementById('toggleLink').textContent = isSignUp ? 'Sign In' : 'Sign Up';
  document.getElementById('nameGroup').style.display = isSignUp ? 'block' : 'none';
  document.getElementById('authAlert').innerHTML = '';
}

function showAlert(msg, type) {
  const el = document.getElementById('authAlert');
  el.innerHTML = '<div class="alert alert-' + type + '">' + msg + '</div>';
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const name = document.getElementById('nameInput').value.trim();

  try {
    if (isSignUp) {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      // Save user profile to Firestore
      await db.collection('users').doc(cred.user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showAlert('Account created! Redirecting...', 'success');
    } else {
      await auth.signInWithEmailAndPassword(email, password);
      showAlert('Signed in! Redirecting...', 'success');
    }
    setTimeout(function() {
      window.location.href = 'dashboard.html';
    }, 1000);
  } catch (err) {
    let msg = 'Something went wrong.';
    if (err.code === 'auth/email-already-in-use') msg = 'Email already registered.';
    if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
    if (err.code === 'auth/wrong-password') msg = 'Wrong password.';
    if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
    if (err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
    showAlert(msg, 'error');
  }
}

// Redirect if already logged in
auth.onAuthStateChanged(function(user) {
  if (user) {
    window.location.href = 'dashboard.html';
  }
});
