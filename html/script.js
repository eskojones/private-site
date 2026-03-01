document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('menu-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const authLink = document.getElementById('auth-link');
    const authModal = document.getElementById('auth-modal');
    const closeModal = document.querySelector('.close-modal');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const loginFormContainer = document.getElementById('login-form-container');
    const signupFormContainer = document.getElementById('signup-form-container');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    // --- Hamburger Menu Logic ---
    if (menuButton && dropdownMenu) {
        menuButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isVisible = dropdownMenu.classList.contains('visible');
            if (isVisible) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        document.addEventListener('click', (event) => {
            if (!menuButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
                closeDropdown();
            }
        });
    }

    function openDropdown() {
        if (!dropdownMenu || !menuButton) return;
        dropdownMenu.classList.remove('hidden');
        menuButton.classList.add('active');
        setTimeout(() => {
            dropdownMenu.classList.add('visible');
            menuButton.setAttribute('aria-expanded', 'true');
        }, 10);
    }

    function closeDropdown() {
        if (!dropdownMenu || !menuButton) return;
        dropdownMenu.classList.remove('visible');
        menuButton.classList.remove('active');
        menuButton.setAttribute('aria-expanded', 'false');
        setTimeout(() => {
            if (!dropdownMenu.classList.contains('visible')) {
                dropdownMenu.classList.add('hidden');
            }
        }, 300);
    }

    // --- Auth Modal Logic ---
    if (authLink) {
        authLink.addEventListener('click', (e) => {
            const loggedInUser = localStorage.getItem('user');
            if (!loggedInUser) {
                e.preventDefault();
                openAuthModal();
            }
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', closeAuthModal);
    }

    window.addEventListener('click', (e) => {
        if (authModal && e.target === authModal) {
            closeAuthModal();
        }
    });

    if (showSignup) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginFormContainer) loginFormContainer.classList.add('hidden');
            if (signupFormContainer) signupFormContainer.classList.remove('hidden');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (signupFormContainer) signupFormContainer.classList.add('hidden');
            if (loginFormContainer) loginFormContainer.classList.remove('hidden');
        });
    }

    function openAuthModal() {
        if (authModal) authModal.classList.remove('hidden');
    }

    function closeAuthModal() {
        if (authModal) authModal.classList.add('hidden');
    }

    // --- Global Key Handlers ---
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeDropdown();
            closeAuthModal();
        }
    });

    // --- Navigation Logic ---
    window.initNavigation = async function() {
        const navContainer = document.getElementById('dynamic-nav');
        if (!navContainer) return;

        try {
            const response = await fetch('/api/nav');
            const navItems = await response.json();
            
            // Re-render nav links
            const authLi = document.getElementById('auth-li');
            const logoutLi = document.getElementById('logout-li');
            const cmsLi = document.getElementById('cms-li');
            
            // Clear current links but keep auth-related ones
            navContainer.innerHTML = '';
            
            navItems.forEach(item => {
                const li = document.createElement('li');
                if (item.slug === 'index') {
                    li.id = 'home-link';
                    li.innerHTML = `<a href="/">Home</a>`;
                } else {
                    li.className = 'dynamic-page-link';
                    li.innerHTML = `<a href="/${item.slug}">${item.title}</a>`;
                }
                navContainer.appendChild(li);
            });
            
            if (cmsLi) navContainer.appendChild(cmsLi);
            navContainer.appendChild(authLi);
            navContainer.appendChild(logoutLi);
            
            // Refresh UI status
            const user = localStorage.getItem('user');
            updateAuthUI(user);
        } catch (err) {
            console.error('Failed to load navigation:', err);
        }
    }

    // --- Authentication Logic ---
    function updateAuthUI(username) {
        const dynamicLinks = document.querySelectorAll('.dynamic-page-link');
        const logoutLi = document.getElementById('logout-li');
        const cmsLi = document.getElementById('cms-li');
        const authLink = document.getElementById('auth-link');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';

        if (username) {
            if (authLink) {
                authLink.textContent = `Hello, ${username}`;
                authLink.href = '/dashboard';
            }
            dynamicLinks.forEach(link => link.classList.add('hidden'));
            if (logoutLi) logoutLi.classList.remove('hidden');
            if (cmsLi && isAdmin) cmsLi.classList.remove('hidden');
        } else {
            if (authLink) {
                authLink.textContent = 'Login / Signup';
                authLink.href = '#';
            }
            dynamicLinks.forEach(link => link.classList.remove('hidden'));
            if (logoutLi) logoutLi.classList.add('hidden');
            if (cmsLi) cmsLi.classList.add('hidden');
        }
    }

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/logout', { method: 'POST' });
            } catch (err) {
                console.error('Logout API failed:', err);
            }
            localStorage.removeItem('user');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }

    // Dashboard-specific logic
    if (window.location.pathname === '/dashboard') {
        const user = localStorage.getItem('user');
        if (!user) {
            window.location.href = '/';
        } else {
            const welcomeMsg = document.getElementById('welcome-message');
            if (welcomeMsg) welcomeMsg.textContent = `Welcome, ${user}`;
        }
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;
            const signupError = document.getElementById('signup-error');

            if (signupError) {
                signupError.classList.add('hidden');
                signupError.textContent = '';
            }

            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                if (response.ok) {
                    if (signupFormContainer) signupFormContainer.classList.add('hidden');
                    if (loginFormContainer) {
                        loginFormContainer.classList.remove('hidden');
                        const loginHeader = loginFormContainer.querySelector('h2');
                        const successMsg = document.createElement('div');
                        successMsg.className = 'success-message';
                        successMsg.textContent = 'Signup successful! Please login.';
                        if (loginHeader) loginHeader.after(successMsg);
                        setTimeout(() => successMsg.remove(), 5000);
                    }
                } else {
                    if (signupError) {
                        signupError.textContent = data.error;
                        signupError.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error('Signup error:', error);
                if (signupError) {
                    signupError.textContent = 'Signup failed. Is the server running?';
                    signupError.classList.remove('hidden');
                }
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const loginError = document.getElementById('login-error');

            if (loginError) {
                loginError.classList.add('hidden');
                loginError.textContent = '';
            }

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('user', data.user.username);
                    localStorage.setItem('isAdmin', data.user.admin);
                    localStorage.setItem('token', data.token);
                    closeAuthModal();
                    updateAuthUI(data.user.username);
                    window.location.href = '/dashboard';
                } else {
                    if (loginError) {
                        loginError.textContent = data.error;
                        loginError.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                if (loginError) {
                    loginError.textContent = 'Login failed. Is the server running?';
                    loginError.classList.remove('hidden');
                }
            }
        });
    }

    initNavigation();
});
