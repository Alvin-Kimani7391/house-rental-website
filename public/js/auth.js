const userInfo = document.getElementById('userInfo');

const userName = localStorage.getItem('userName');

if (userInfo && userName) {
    userInfo.textContent = `Hi, ${userName}`;
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}