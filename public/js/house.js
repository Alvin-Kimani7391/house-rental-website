
const params = new URLSearchParams(window.location.search);
const houseId = params.get("id");
console.log("houseId from URL:", houseId);


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



const container = document.getElementById("houseDetails");

let currentSlide = 0;

/* ================= LOAD HOUSE ================= */

async function loadHouse() {
    try {
        showLoader();
        const res = await fetch(`/api/houses/${houseId}`);
        hideLoader();
        if (!res.ok) {
            throw new Error("House not found");
        }

        const house = await res.json();

        // Combine images + video into one media array
        const mediaItems = [
            ...(house.images || []),
            ...(house.video ? [house.video] : [])
        ];

        container.innerHTML = `
            <div class="details-container">

                <div class="media-carousel">
                    ${mediaItems.length > 1 ? `
                        <button class="arrow left" onclick="prevMedia()">❮</button>
                        <button class="arrow right" onclick="nextMedia()">❯</button>
                    ` : ''}

                    <div class="media-wrapper">
                        ${
                            mediaItems.length > 0
                            ? mediaItems.map((item, index) => `
                                <div class="media-slide ${index === 0 ? 'active' : ''}">
                                    ${
                                        item.includes('.mp4') || item.includes('video')
                                        ? `<video controls src="${item}"></video>`
                                        : `<img src="${item}" alt="House media">`
                                    }
                                </div>
                            `).join('')
                            : `<div class="media-slide active">
                                    <p style="padding:40px;">No media available</p>
                               </div>`
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

                    <button class="contact-btn">Contact Owner</button>
                </div>

            </div>

            <h2>Related Houses</h2>
            <div class="houses-container" id="relatedContainer"></div>
        `;

        loadRelatedHouses(house);

    } catch (err) {
        console.error(err);
        container.innerHTML = "<h2>House not found.</h2>";
    }
}

/* ================= CAROUSEL FUNCTIONS ================= */

function showSlide(index) {
    const slides = document.querySelectorAll(".media-slide");

    if (slides.length === 0) return;

    slides[currentSlide].classList.remove("active");

    currentSlide = (index + slides.length) % slides.length;

    slides[currentSlide].classList.add("active");
}

function nextMedia() {
    showSlide(currentSlide + 1);
}

function prevMedia() {
    showSlide(currentSlide - 1);
}

/* ================= RELATED HOUSES ================= */

async function loadRelatedHouses(currentHouse) {
    try {
        const res = await fetch(`/api/houses`);
        const houses = await res.json();

        const related = houses.filter(h =>
            h.location === currentHouse.location &&
            h._id !== currentHouse._id
        );

        const relatedContainer = document.getElementById("relatedContainer");

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

/* ================= NAVIGATION ================= */

function goToHouse(id) {
    window.location.href = `house.html?id=${id}`;
}

/* ================= INIT ================= */

loadHouse();