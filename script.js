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
        }
    });
});
