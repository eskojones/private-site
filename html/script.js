document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('menu-button');
    const dropdownMenu = document.getElementById('dropdown-menu');

    // Toggle dropdown on button click
    menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const isVisible = dropdownMenu.classList.contains('visible');
        
        if (isVisible) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });

    // Function to open the dropdown
    function openDropdown() {
        dropdownMenu.classList.remove('hidden');
        menuButton.classList.add('active');
        // Small delay to allow the CSS transitions to work
        setTimeout(() => {
            dropdownMenu.classList.add('visible');
            menuButton.setAttribute('aria-expanded', 'true');
        }, 10);
    }

    // Function to close the dropdown
    function closeDropdown() {
        dropdownMenu.classList.remove('visible');
        menuButton.classList.remove('active');
        menuButton.setAttribute('aria-expanded', 'false');
        
        // Hide after transition completes
        setTimeout(() => {
            if (!dropdownMenu.classList.contains('visible')) {
                dropdownMenu.classList.add('hidden');
            }
        }, 300);
    }

    // Close dropdown when clicking anywhere else on the page
    document.addEventListener('click', (event) => {
        if (!menuButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
            closeDropdown();
        }
    });

    // Close dropdown when pressing the Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeDropdown();
            closeAuthModal();
        }
    });

    // Auth Modal Logic
    const authLink = document.getElementById('auth-link');
    const authModal = document.getElementById('auth-modal');
    const closeModal = document.querySelector('.close-modal');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const loginFormContainer = document.getElementById('login-form-container');
    const signupFormContainer = document.getElementById('signup-form-container');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    authLink.addEventListener('click', (e) => {
        const loggedInUser = localStorage.getItem('user');
        if (!loggedInUser) {
            e.preventDefault();
            openAuthModal();
        }
    });

    closeModal.addEventListener('click', closeAuthModal);

    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeAuthModal();
        }
    });

    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.add('hidden');
        signupFormContainer.classList.remove('hidden');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    });

    function openAuthModal() {
        authModal.classList.remove('hidden');
    }

    function closeAuthModal() {
        authModal.classList.add('hidden');
    }

    // Handle Signup Submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const signupError = document.getElementById('signup-error');

        signupError.classList.add('hidden');
        signupError.textContent = '';

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                // Success - switch to login and show success
                signupFormContainer.classList.add('hidden');
                loginFormContainer.classList.remove('hidden');
                
                const loginHeader = loginFormContainer.querySelector('h2');
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = 'Signup successful! Please login.';
                loginHeader.after(successMsg);
                
                setTimeout(() => successMsg.remove(), 5000);
            } else {
                signupError.textContent = data.error;
                signupError.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Signup error:', error);
            signupError.textContent = 'Signup failed. Is the server running?';
            signupError.classList.remove('hidden');
        }
    });

    // Handle Login Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const loginError = document.getElementById('login-error');

        loginError.classList.add('hidden');
        loginError.textContent = '';

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
                updateAuthLink(data.username);
                window.location.href = 'dashboard.html';
            } else {
                loginError.textContent = data.error;
                loginError.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Login failed. Is the server running?';
            loginError.classList.remove('hidden');
        }
    });

    function updateAuthLink(username) {
        const featuresLink = document.getElementById('features-link');
        const aboutLink = document.getElementById('about-link');
        const contactLink = document.getElementById('contact-link');

        if (username) {
            authLink.textContent = `Hello, ${username}`;
            authLink.href = 'dashboard.html';
            
            // Hide other links when logged in
            if (featuresLink) featuresLink.classList.add('hidden');
            if (aboutLink) aboutLink.classList.add('hidden');
            if (contactLink) contactLink.classList.add('hidden');
        } else {
            authLink.textContent = 'Login / Signup';
            authLink.href = '#';
            
            // Show other links when logged out
            if (featuresLink) featuresLink.classList.remove('hidden');
            if (aboutLink) aboutLink.classList.remove('hidden');
            if (contactLink) contactLink.classList.remove('hidden');
        }
    }

    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
        updateAuthLink(loggedInUser);
    }
});
