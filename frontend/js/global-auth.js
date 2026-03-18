// global-auth.js
auth.onAuthStateChanged(async function (user) {
  const navLinks = document.getElementById('navLinks') || document.querySelector('.nav-links');
  let navUser = document.getElementById('navUser');

  if (!navUser) {
    navUser = document.createElement('div');
    navUser.className = 'nav-user';
    navUser.id = 'navUser';
    navUser.style.display = 'none';
    navUser.innerHTML = `
      <div class="user-avatar" onclick="this.classList.toggle('active')" tabindex="0">
        <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23fce7f3'/><text x='50' y='65' font-size='50' text-anchor='middle' fill='%23db2777'>👩</text></svg>" alt="User">
        <div class="user-dropdown">
          <div class="user-name" id="userName">User</div>
          <button class="btn-logout" onclick="logOut()">Logout</button>
        </div>
      </div>
    `;
    navLinks.parentNode.appendChild(navUser);
  }

  const loginLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.getAttribute('href').includes('login.html'));

  if (user) {
    if (loginLink) loginLink.parentElement.style.display = 'none';
    navUser.style.display = 'flex';

    // Set user name
    const nameEl = document.getElementById('userName');
    if (nameEl) {
      if (user.displayName) {
        nameEl.textContent = user.displayName;
      } else {
        nameEl.textContent = user.email || 'User';
        db.collection('users').doc(user.uid).get().then(doc => {
          if (doc.exists && doc.data().name) {
            nameEl.textContent = doc.data().name;
          }
        }).catch(() => { });
      }
    }
  } else {
    if (loginLink) loginLink.parentElement.style.display = '';
    navUser.style.display = 'none';
  }
});

window.logOut = function () {
  auth.signOut().then(function () {
    window.location.href = 'login.html';
  });
};
