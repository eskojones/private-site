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
        e.preventDefault();
        openAuthModal();
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

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Signup successful! You can now login.');
                signupFormContainer.classList.add('hidden');
                loginFormContainer.classList.remove('hidden');
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('Signup failed. Is the server running?');
        }
    });

    // Handle Login Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Login successful! Welcome ${data.username}`);
                localStorage.setItem('user', data.username);
                closeAuthModal();
                updateAuthLink(data.username);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Is the server running?');
        }
    });

    function updateAuthLink(username) {
        if (username) {
            authLink.textContent = `Hello, ${username}`;
        }
    }

    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
        updateAuthLink(loggedInUser);
    }
});
