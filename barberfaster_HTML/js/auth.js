(function () {

  function init() {
    var authNavItem = document.getElementById('authNavItem');
    if (!authNavItem) return;

    var user = null;
    try { user = JSON.parse(localStorage.getItem('bf_user')); } catch (e) { }

    if (user) {
      renderLoggedIn(authNavItem, user);
    } else {
      renderLoggedOut(authNavItem);
    }
  }

  function renderLoggedIn(container, user) {
    var isBarbero = user.tipo === 'barbero';
    var barberiaLink = isBarbero
      ? '<a href="dashboard.html" class="nav-user-menu-item">' +
        '<i class="bi bi-shop"></i> Mi Barbería</a>'
      : '';

    container.className = 'nav-item ms-lg-2';
    container.innerHTML =
      '<div class="nav-user-dropdown">' +
        '<button class="nav-user-btn" id="navUserBtn" type="button">' +
          '<i class="bi bi-person-circle"></i>' +
          '<span class="nav-user-name">' + escapeHtml(user.usuario) + '</span>' +
          '<i class="bi bi-chevron-down nav-user-chevron"></i>' +
        '</button>' +
        '<div class="nav-user-menu" id="navUserMenu">' +
          '<a href="perfil.html" class="nav-user-menu-item">' +
            '<i class="bi bi-person"></i> Mi perfil' +
          '</a>' +
          barberiaLink +
          '<button type="button" class="nav-user-menu-item nav-user-logout" id="navLogout">' +
            '<i class="bi bi-box-arrow-right"></i> Cerrar sesión' +
          '</button>' +
        '</div>' +
      '</div>';

    var btn = document.getElementById('navUserBtn');
    var menu = document.getElementById('navUserMenu');
    var logoutBtn = document.getElementById('navLogout');

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('nav-user-menu--open');
      btn.classList.toggle('nav-user-btn--active');
    });

    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem('bf_user');
      window.location.href = 'index.html';
    });

    document.addEventListener('click', function (e) {
      if (!container.contains(e.target)) {
        menu.classList.remove('nav-user-menu--open');
        btn.classList.remove('nav-user-btn--active');
      }
    });
  }

  function renderLoggedOut(container) {
    container.className = 'nav-item ms-lg-2';
    container.innerHTML =
      '<a href="login.html" class="btn nav-login-btn">' +
        '<i class="bi bi-box-arrow-in-right"></i> Iniciar sesión' +
      '</a>';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', init);
})();