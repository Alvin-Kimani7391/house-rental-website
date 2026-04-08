// ================== house.js ==================
const params = new URLSearchParams(window.location.search);
const houseId = params.get("id");
console.log("houseId from URL:", houseId);

const container = document.getElementById("houseDetails");
let currentSlide = 0;

// ================== LOADER ==================
function createLoader() {
    if (document.getElementById('loader-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'loader-overlay';
    Object.assign(overlay.style, {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(5px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
    });

    const loader = document.createElement('div');
    loader.style.position = 'relative';
    loader.style.width = '100px';
    loader.style.height = '100px';

    const house = document.createElement('div');
    house.innerHTML = '🏠';
    Object.assign(house.style, {
        position: 'absolute', top: '50%', left: '56%',
        transform: 'translate(-50%, -50%)', fontSize: '40px',
    });
    loader.appendChild(house);

    for (let i = 0; i < 12; i++) {
        const dot = document.createElement('div');
        Object.assign(dot.style, {
            width: '12px', height: '12px', background: '#00b894', borderRadius: '50%',
            position: 'absolute', top: '50%', left: '50%',
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

// ================== FETCH SINGLE HOUSE ==================
async function loadHouse() {
    if (!houseId) {
        container.innerHTML = "<p style='color:red;'>No house ID provided.</p>";
        return;
    }

    try {
        showLoader();
        const token = localStorage.getItem("token");

        const res = await fetch(`/api/houses/${houseId}`, {
            method: "GET",
            headers: token ? { "Authorization": `Bearer ${token}` } : {},
            credentials: "include" // ensures session cookies for view tracking
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "House not found");
        }

        const house = await res.json();

        // Combine images + video
        const mediaItems = [...(house.images || []), ...(house.video ? [house.video] : [])];

        // Render house details
        container.innerHTML = `
            <div class="details-container">

                <div class="media-carousel">
                    ${mediaItems.length > 1 ? `
                        <button class="arrow left" onclick="prevMedia()">❮</button>
                        <button class="arrow right" onclick="nextMedia()">❯</button>
                    ` : ''}

                    <div class="media-wrapper">
                        ${mediaItems.length > 0
                            ? mediaItems.map((item, index) => `
                                <div class="media-slide ${index === 0 ? 'active' : ''}">
                                    ${item.includes('.mp4') || item.includes('video')
                                        ? `<video controls src="${item}"></video>`
                                        : `<img src="${item}" alt="House media">`
                                    }
                                </div>
                            `).join('')
                            : `<div class="media-slide active"><p style="padding:40px;">No media available</p></div>`
                        }
                    </div>
                </div>

                <div class="details-info">
                    <h1>${house.title}</h1>
                    <div class="price-highlight">$${house.price}/month</div>
                    <p><strong>Location:</strong> ${house.location}</p>
                    <p><strong>Bedrooms:</strong> ${house.bedrooms}</p>
                    <p><strong>Bathrooms:</strong> ${house.bathrooms}</p>
                    <p><strong>Description:</strong> ${house.description}</p>
                    <p><strong>Contact:</strong> ${house.contact}</p>
                    <p><strong>Views:</strong> ${house.views || 0}</p>
                    <button id="favoriteBtn">${house.isSaved ? "❤️ Remove from favorites" : "🤍 Add to favorites"}</button>
                    <button class="contact-btn">Contact Owner</button>
                </div>

            </div>

            <h2>Related Houses</h2>
            <div class="houses-container" id="relatedContainer"></div>
        `;

        setupFavoriteButton(house);
        loadRelatedHouses(house);

    } catch (err) {
        console.error(err);
        container.innerHTML = `<h2 style="color:red;">${err.message}</h2>`;
    } finally {
        hideLoader();
    }
}

// ================== FAVORITE BUTTON ==================
function setupFavoriteButton(house) {
    const favBtn = document.getElementById("favoriteBtn");
    favBtn.addEventListener("click", async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login to save favorites!");
            window.location.href = "login.html";
            return;
        }

        try {
            const res = await fetch(`/api/houses/${house._id}/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                house.isSaved = !house.isSaved;
                favBtn.textContent = house.isSaved ? "❤️ Remove from favorites" : "🤍 Add to favorites";
            } else {
                alert(result.message || "Error saving favorite");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving favorite");
        }
    });
}

// ================== CAROUSEL FUNCTIONS ==================
function showSlide(index) {
    const slides = document.querySelectorAll(".media-slide");
    if (!slides.length) return;

    slides[currentSlide].classList.remove("active");
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add("active");
}
function nextMedia() { showSlide(currentSlide + 1); }
function prevMedia() { showSlide(currentSlide - 1); }

// ================== RELATED HOUSES ==================
async function loadRelatedHouses(currentHouse) {
    try {
        const res = await fetch(`/api/houses`);
        const houses = await res.json();

        const related = houses.filter(h => h.location === currentHouse.location && h._id !== currentHouse._id);
        const relatedContainer = document.getElementById("relatedContainer");

        relatedContainer.innerHTML = '';
        related.forEach(house => {
            const card = document.createElement("div");
            card.className = "card";
            card.onclick = () => goToHouse(house._id);

            card.innerHTML = `
                <img src="${house.images?.[0] || ''}" alt="${house.title}">
                <div class="card-body">
                    <h3>${house.title}</h3>
                    <p>${house.location}</p>
                    <p class="price">$${house.price}/month</p>
                </div>
            `;
            relatedContainer.appendChild(card);
        });

    } catch (err) {
        console.error("Error loading related houses", err);
    }
}

// ================== NAVIGATION ==================
function goToHouse(id) {
    window.location.href = `house.html?id=${id}`;
}

// ================== INIT ==================
loadHouse();