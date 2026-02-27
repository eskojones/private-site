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

    // --- Authentication Logic ---
    function updateAuthUI(username) {
        const featuresLink = document.getElementById('features-link');
        const aboutLink = document.getElementById('about-link');
        const contactLink = document.getElementById('contact-link');

        if (username) {
            if (authLink) {
                authLink.textContent = `Hello, ${username}`;
                authLink.href = 'dashboard.html';
            }
            if (featuresLink) featuresLink.classList.add('hidden');
            if (aboutLink) aboutLink.classList.add('hidden');
            if (contactLink) contactLink.classList.add('hidden');
        } else {
            if (authLink) {
                authLink.textContent = 'Login / Signup';
                authLink.href = '#';
            }
            if (featuresLink) featuresLink.classList.remove('hidden');
            if (aboutLink) aboutLink.classList.remove('hidden');
            if (contactLink) contactLink.classList.remove('hidden');
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
                    localStorage.setItem('user', data.username);
                    closeAuthModal();
                    updateAuthUI(data.username);
                    window.location.href = 'dashboard.html';
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

    // Initial UI Setup
    const loggedInUser = localStorage.getItem('user');
    updateAuthUI(loggedInUser);
});
