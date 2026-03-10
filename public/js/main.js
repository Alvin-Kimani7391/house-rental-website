// ================== main.js ==================
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById("houseContainer");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const suggestionsList = document.getElementById("suggestions");
    const pagination = document.getElementById("pagination");
    const geoBtn = document.getElementById("geoBtn"); // Geo button

    let currentPage = 1;
    const housesPerPage = 9;
    let houses = [];          // All houses fetched
    let filteredHouses = [];  // Houses filtered by search/nearby
    let activeSuggestion = -1;

    // ================== NEARBY LABEL ==================
    const nearbyLabel = document.createElement("h2");
    nearbyLabel.style.cssText = `
        text-align: center;
        color: #00b894;
        margin: 20px 0;
        font-size: 1.5rem;
        display: none;
    `;
    container.parentNode.insertBefore(nearbyLabel, container);

    // ================== LOADER FUNCTIONS ==================
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

    // ================== UTILITY ==================
    function shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    function isLoggedIn() {
        return localStorage.getItem('token');
    }



    // ================== FOOTER FILTER -> SEARCH ==================

document.querySelectorAll(".property-filter").forEach(link => {

    link.addEventListener("click", function(e) {
        e.preventDefault();

        const searchValue = this.dataset.search;

        // put value in search box
        searchInput.value = searchValue;

        // trigger search
        searchHouses();

        // scroll to listings
        document.querySelector(".listings").scrollIntoView({
            behavior: "smooth"
        });
    });

});


// ================== PROPERTY TYPE FILTER (USING TITLE) ==================

document.querySelectorAll(".property-filter").forEach(link => {

    link.addEventListener("click", function(e) {
        e.preventDefault();

        const type = this.dataset.type.toLowerCase();

        const filtered = houses.filter(house =>
            house.title && house.title.toLowerCase().includes(type)
        );

        loadHouses(filtered);

        // scroll to listings
        document.querySelector(".listings").scrollIntoView({
            behavior: "smooth"
        });

    });

});




    // ================== FETCH HOUSES ==================
    async function fetchHouses() {
        try {
            showLoader();
            const res = await fetch('/api/houses');
            const data = await res.json();
            if (!Array.isArray(data)) {
                console.error('API did not return an array:', data);
                container.innerHTML = `<p style="color:red;">Error: Invalid data from API</p>`;
                return;
            }
            houses = shuffleArray(data);
            filteredHouses = houses;
            loadHouses(filteredHouses);
            setupPagination(filteredHouses);
        } catch (err) {
            container.innerHTML = `<p style="color:red;">Error loading houses: ${err.message}</p>`;
            console.error(err);
        } finally {
            hideLoader();
        }
    }

    // ================== FETCH NEARBY HOUSES ==================
    async function fetchNearbyHouses(lat, lng) {
        try {
            showLoader();
            const res = await fetch(`/api/houses/nearby?lat=${lat}&lng=${lng}`);
            const nearbyHouses = await res.json();
if (Array.isArray(nearbyHouses) && nearbyHouses.length > 0) {
    filteredHouses = nearbyHouses;
    currentPage = 1;

    // Remove previous badge if exists
    const oldBadge = document.querySelector('.nearby-badge');
    if (oldBadge) oldBadge.remove();

    // Create badge element
    const badge = document.createElement('div');
    badge.className = 'nearby-badge show-center';
    badge.innerHTML = `<i class="fa-solid fa-location-dot"></i> <span>Showing houses near you</span>`;
    document.body.appendChild(badge);

    // After popup animation, move it to top-center
    setTimeout(() => {
        badge.classList.remove('show-center');
        badge.classList.add('show-top'); // new class for top-center
    }, 2000); // 2 seconds for initial popup

    loadHouses(filteredHouses);
    setupPagination(filteredHouses);
} else {
                nearbyLabel.style.display = "none";
                container.innerHTML = "<p>No nearby houses found.</p>";
            }
        } catch (err) {
            nearbyLabel.style.display = "none";
            console.error("Error fetching nearby houses:", err);
            container.innerHTML = `<p style="color:red;">Error fetching nearby houses.</p>`;
        } finally {
            hideLoader();
        }
    }

    // ================== LOAD HOUSES ==================
    function loadHouses(data) {
        container.innerHTML = "";

        if (!data || data.length === 0) {
            container.innerHTML = "<p>No houses found.</p>";
            return;
        }

        const start = (currentPage - 1) * housesPerPage;
        const end = start + housesPerPage;
        const housesToShow = data.slice(start, end);

        housesToShow.forEach(house => {
            const card = document.createElement("div");
            card.className = "card";

            const tooltip = document.createElement("div");
            tooltip.className = "tooltip";
            tooltip.textContent = "Click the house to view more details";
            card.appendChild(tooltip);

            card.onclick = () => {
                if (!isLoggedIn()) {
                    alert("Please login to view house details!");
                    window.location.href = "login.html";
                    return;
                }
                window.location.href = `house.html?id=${house._id}`;
            };

            if (house.images && house.images.length > 0) {

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "card-image";

    const img = document.createElement("img");
    img.src = house.images[0];
    img.alt = house.title;

    imageWrapper.appendChild(img);

    // STATUS BADGE
    const badge = document.createElement("span");
    badge.className = `status-badge ${house.status || "available"}`;
    badge.textContent = house.status ? house.status.toUpperCase() : "AVAILABLE";

    imageWrapper.appendChild(badge);

    card.appendChild(imageWrapper);
}

            const cardBody = document.createElement("div");
            cardBody.className = "card-body";

            const title = document.createElement("h3");
            title.textContent = house.title;
            cardBody.appendChild(title);

            const location = document.createElement("p");
            location.textContent = house.location;
            cardBody.appendChild(location);

            const price = document.createElement("p");
            price.className = "price";
            price.textContent = `$${house.price}/month`;
            cardBody.appendChild(price);

            card.appendChild(cardBody);
            container.appendChild(card);
        });
    }

    // ================== PAGINATION ==================
    function setupPagination(data) {
        pagination.innerHTML = "";
        const pageCount = Math.ceil(data.length / housesPerPage);
        if (pageCount <= 1) return;

        const createButton = (text, page, className = "") => {
            const btn = document.createElement("button");
            btn.textContent = text;
            if (className) btn.classList.add(className);
            if (page === currentPage) btn.classList.add("active");

            btn.addEventListener("click", () => {
                currentPage = page;
                loadHouses(data);
                setupPagination(data);
                document.querySelector(".listings").scrollIntoView({ behavior: "smooth" });
            });
            return btn;
        };

        if (currentPage > 1) pagination.appendChild(createButton("←", currentPage - 1, "nav"));

        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(pageCount, start + maxVisible - 1);

        if (start > 1) {
            pagination.appendChild(createButton(1, 1));
            if (start > 2) {
                const dots = document.createElement("span");
                dots.textContent = "...";
                pagination.appendChild(dots);
            }
        }

        for (let i = start; i <= end; i++) pagination.appendChild(createButton(i, i));

        if (end < pageCount) {
            if (end < pageCount - 1) {
                const dots = document.createElement("span");
                dots.textContent = "...";
                pagination.appendChild(dots);
            }
            pagination.appendChild(createButton(pageCount, pageCount));
        }

        if (currentPage < pageCount) pagination.appendChild(createButton("→", currentPage + 1, "nav"));
    }


// Dynamic year in footer
document.getElementById("year").textContent = new Date().getFullYear();

    // ================== GEO BUTTON CLICK ==================
    if (geoBtn) {
        geoBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser.");
                return;
            }
            showLoader();
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    fetchNearbyHouses(lat, lng);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    hideLoader();
                    if (err.code === err.PERMISSION_DENIED) {
                        alert("You denied location permission. Please allow to see nearby houses.");
                    } else {
                        alert("Error getting location. Please try again.");
                    }
                }
            );
        });
    }

    // ================== SEARCH ==================
    function searchHouses() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (!searchTerm) {
            loadHouses(houses);
            return;
        }

        const filtered = houses.filter(h =>
            h.location.toLowerCase().includes(searchTerm) ||
            h.title.toLowerCase().includes(searchTerm)
        );
        filteredHouses = filtered;
        currentPage = 1;
        loadHouses(filteredHouses);
        setupPagination(filteredHouses);
    }

    // ================== AUTOCOMPLETE ==================
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) return hideSuggestions();

        const towns = [...new Set(houses.map(h => h.location))];
        const startsWith = towns.filter(t => t.toLowerCase().startsWith(query));
        const includes = towns.filter(t => !t.toLowerCase().startsWith(query) && t.toLowerCase().includes(query));
        const filtered = [...startsWith, ...includes];

        suggestionsList.innerHTML = "";
        activeSuggestion = -1;

        filtered.forEach(town => {
            const li = document.createElement("li");
            const regex = new RegExp(`(${query})`, "gi");
            li.innerHTML = town.replace(regex, "<mark>$1</mark>");
            li.addEventListener("click", () => {
                searchInput.value = town;
                hideSuggestions();
                searchHouses();
            });
            suggestionsList.appendChild(li);
        });

        showSuggestions();
    });

    searchInput.addEventListener("keydown", e => {
        const items = suggestionsList.querySelectorAll("li");
        if (!items.length) return;

        if (e.key === "ArrowDown") { e.preventDefault(); activeSuggestion = (activeSuggestion + 1) % items.length; setActive(items); }
        else if (e.key === "ArrowUp") { e.preventDefault(); activeSuggestion = (activeSuggestion - 1 + items.length) % items.length; setActive(items); }
        else if (e.key === "Enter") { e.preventDefault(); if (activeSuggestion >= 0 && activeSuggestion < items.length) items[activeSuggestion].click(); else { searchHouses(); hideSuggestions(); } }
        else if (e.key === "Escape") hideSuggestions();
    });

    document.addEventListener("click", e => { if (!e.target.closest(".search-box")) hideSuggestions(); });
    searchBtn.addEventListener("click", e => { e.preventDefault(); searchHouses(); hideSuggestions(); });
    function showSuggestions() { suggestionsList.classList.add("active"); }
    function hideSuggestions() { suggestionsList.classList.remove("active"); }
    function setActive(items) { items.forEach((li, idx) => li.classList.toggle("active", idx === activeSuggestion)); }

    // ================== INITIAL LOAD ==================
    nearbyLabel.style.display = "none"; // hide nearby label
    fetchHouses(); // load default all houses
});