const loginForm = document.getElementById('loginForm');


const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.textContent = type === 'password' ? 'Show' : 'Hide';
    });
}

// ================== LOADER ==================
function createLoader() {
    if (document.getElementById('loader-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'loader-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '9999',
    });

    const loader = document.createElement('div');
    loader.style.position = 'relative';
    loader.style.width = '100px';
    loader.style.height = '100px';

    const house = document.createElement('div');
    house.innerHTML = '🏠';
    Object.assign(house.style, {
        position: 'absolute',
        top: '50%',
        left: '56%',
        transform: 'translate(-50%, -50%)',
        fontSize: '40px',
    });
    loader.appendChild(house);

    for (let i = 0; i < 12; i++) {
        const dot = document.createElement('div');
        Object.assign(dot.style, {
            width: '12px',
            height: '12px',
            background: '#00b894',
            borderRadius: '50%',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `rotate(${i*30}deg) translate(40px)`,
            transformOrigin: 'center center',
            animation: `spinDots 0.6s linear infinite`,
            animationDelay: `${i*0.05}s`,
        });
        loader.appendChild(dot);
    }

    overlay.appendChild(loader);
    document.body.appendChild(overlay);

    if (!document.getElementById('loader-style')) {
        const style = document.createElement('style');
        style.id = 'loader-style';
        style.innerHTML = `
        @keyframes spinDots {
            0% { transform: rotate(0deg) translate(40px); }
            100% { transform: rotate(360deg) translate(40px); }
        }`;
        document.head.appendChild(style);
    }
}

function showLoader() {
    createLoader();
    const overlay = document.getElementById('loader-overlay');
    overlay.style.display = 'flex';
}

function hideLoader() {
    const overlay = document.getElementById('loader-overlay');
    if (overlay) overlay.style.display = 'none';
}

/* ================== GLOBAL CLICK LOADER ================== */
// Show loader on any link/button click that would navigate away
document.addEventListener('click', function(e){
    const target = e.target.closest('a, button');
    if(!target) return;

    // Only show loader for navigation links (<a href="...">) that aren't anchors or JS-only
    if(target.tagName === 'A' && target.href && !target.href.startsWith('#')){
        showLoader();
    }

    // Optional: show loader for any button that triggers navigation via JS
    if(target.tagName === 'BUTTON' && target.dataset.navigate){
        showLoader();
    }
})



loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {

        showLoader();
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        const data = await res.json();
        hideLoader();
        if (res.ok) {
            // Save user info in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('role', data.user.role);

            alert(`Welcome ${data.user.name}!`);
            window.location.href = 'index2.html'; // redirect to dashboard
        } else {
            alert(data.message);
        }

    } catch (err) {
        console.error(err);
        alert("Login failed. Please try again.");
    }
});