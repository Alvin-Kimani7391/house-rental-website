async function loadNavbar() {

    const res = await fetch('/components/navbar.html');
    const data = await res.text();

    document.getElementById('navbar-container').innerHTML = data;

    initNavbar();
    highlightActivePage();
    initMobileMenu();
}

function initNavbar() {

    const userInfo = document.getElementById('userInfo');
    const roleBadge = document.getElementById('roleBadge');
    const addListingLink = document.getElementById('addListingLink');

    const userName = localStorage.getItem('userName');
    const role = localStorage.getItem('role');

    if (!userName) {
        window.location.href = 'login.html';
        return;
    }

    userInfo.textContent = `Hi, ${userName}`;

    if (roleBadge && role) {
        roleBadge.textContent = role;
    }

    if (role !== 'agent' && role !== 'owner') {
        if (addListingLink) {
            addListingLink.style.display = 'none';
        }
    }

    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

}

function highlightActivePage() {

    const currentPage = window.location.pathname.split("/").pop();

    const links = document.querySelectorAll(".nav-links a");

    links.forEach(link => {

        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage) {
            link.classList.add("active");
        }

    });

}

function initMobileMenu() {

    const menuBtn = document.getElementById('mobileMenu');
    const navLinks = document.getElementById('navLinks');

    if (menuBtn) {

        menuBtn.addEventListener('click', () => {

            navLinks.classList.toggle('active');

        });

    }

}

loadNavbar();