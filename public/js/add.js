// ================== AUTH CHECK ==================
const token = localStorage.getItem("token");
if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
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
        background: 'rgba(107, 107, 107, 0.4)',
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

// ================== FORM ELEMENTS ==================
const form = document.getElementById("listingForm");
const imageInput = form.querySelector('input[name="images"]');
const videoInput = form.querySelector('input[name="video"]');

// ================== PREVIOUS LISTINGS SECTION ==================
const myListingsSection = document.createElement("div");
myListingsSection.style.marginBottom = "30px";
form.parentNode.insertBefore(myListingsSection, form);

// ================== LOAD MY LISTINGS ==================
async function loadMyListings() {
    try {
        
        const res = await fetch("/api/houses/my/listings", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const houses = await res.json();
        

        const showArrows = houses.length > 3;

        myListingsSection.innerHTML = `
        <div class="dashboard-header">
            <h2>Your Listings</h2>
            <span class="listing-count">${houses.length} Properties</span>
        </div>
        <div class="dashboard-scroll-wrapper">
            ${showArrows ? '<button class="scroll-btn scroll-left">&#10094;</button>' : ''}
            <div class="dashboard-grid"></div>
            ${showArrows ? '<button class="scroll-btn scroll-right">&#10095;</button>' : ''}
        </div>`;

        const container = myListingsSection.querySelector(".dashboard-grid");
        if (!houses.length) {
            container.innerHTML = "<p>No listings yet.</p>";
            return;
        }

        houses.slice(0, 10).forEach(house => {
            const card = document.createElement("div");
            card.className = "dashboard-card";
            const firstImage = house.images?.[0]?.url || house.images?.[0] || "placeholder.jpg";
            card.innerHTML = `
            <div class="dashboard-image">
                <img src="${firstImage}" alt="${house.title}">
               <div class="dashboard-overlay">
    <button class="edit-btn" data-id="${house._id}">Edit</button>
    <button class="delete-btn" data-id="${house._id}">Delete</button>

    <div class="status-dropdown" data-id="${house._id}">
    <button class="status-btn ${house.status}">${house.status}</button>
    <div class="status-options">
        <div class="status-option" data-value="available">Available</div>
        <div class="status-option" data-value="booked">Booked</div>
        <div class="status-option" data-value="rented">Rented</div>
    </div>
</div>
</div>
            </div>
            <div class="dashboard-body">
                <h3>${house.title}</h3>
                <p>${house.location}</p>
                <p class="price">$${house.price}</p>
            </div>`;
            container.appendChild(card);
        });

        // Scroll buttons
        const wrapper = myListingsSection.querySelector(".dashboard-scroll-wrapper");
        wrapper.classList.toggle("few-cards", houses.length <= 3);

        const leftBtn = myListingsSection.querySelector(".scroll-left");
        const rightBtn = myListingsSection.querySelector(".scroll-right");
        if (leftBtn && rightBtn) {
            leftBtn.onclick = () => container.scrollBy({ left: -320, behavior: "smooth" });
            rightBtn.onclick = () => container.scrollBy({ left: 320, behavior: "smooth" });
        }

    } catch (err) {
        hideLoader();
        console.error("Error loading listings:", err);
        myListingsSection.innerHTML = "<p>Error loading listings.</p>";
    }
}

// ================== PREVIEW CONTAINERS ==================
const imagePreviewContainer = document.createElement("div");
imagePreviewContainer.id = "image-preview-container";
form.insertBefore(imagePreviewContainer, imageInput.nextSibling);

const videoPreviewContainer = document.createElement("div");
videoPreviewContainer.id = "video-preview-container";
form.insertBefore(videoPreviewContainer, videoInput.nextSibling);

// ================== IMAGE & VIDEO PREVIEW ==================
imageInput.addEventListener("change", () => {
    imagePreviewContainer.innerHTML = "";
    Array.from(imageInput.files).forEach(file => {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        Object.assign(img.style, { width:"120px", margin:"5px", objectFit:"cover", borderRadius:"6px" });
        imagePreviewContainer.appendChild(img);
    });
});

videoInput.addEventListener("change", () => {
    videoPreviewContainer.innerHTML = "";
    const file = videoInput.files[0];
    if(file){
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        video.controls = true;
        Object.assign(video.style, { width:"250px", marginTop:"5px", borderRadius:"6px" });
        videoPreviewContainer.appendChild(video);
    }
});

// ================== HANDLE FORM SUBMIT ==================
form.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = new FormData(form);
    if (!formData.getAll("images").length) { alert("Please upload at least one image."); return; }
    try {
        showLoader();
        const res = await fetch("/api/houses", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            alert("Listing Added Successfully!");
            form.reset();
            imagePreviewContainer.innerHTML = "";
            videoPreviewContainer.innerHTML = "";
            await loadMyListings();
        } else alert("Error: "+(data.message||data.error));
    } catch(err) {
        alert("Server error: "+err.message);
    } finally { hideLoader(); }
});

// ================== DELETE & EDIT EVENT DELEGATION ==================
myListingsSection.addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if(!btn) return;

    if(btn.classList.contains("delete-btn")){
        if(!confirm("Delete this listing?")) return;
        showLoader();
        await fetch(`/api/houses/${btn.dataset.id}`, {
            method:"DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        await loadMyListings();
        hideLoader();
    }

    
    


    if(btn.classList.contains("edit-btn")){
        window.location.href = `edit.html?id=${btn.dataset.id}`;
    }
});


// ================== STATUS DROPDOWN BUTTON ==================
myListingsSection.addEventListener('click', async e => {
    const dropdown = e.target.closest('.status-dropdown');
    
    // Toggle dropdown visibility
    if(e.target.classList.contains('status-btn')){
        const options = dropdown.querySelector('.status-options');
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
        return;
    }

    // Option clicked
    if(e.target.classList.contains('status-option')){
        const houseId = dropdown.dataset.id;
        const newStatus = e.target.dataset.value;
        const btn = dropdown.querySelector('.status-btn');

        // Update button immediately
        btn.textContent = newStatus;
        btn.className = `status-btn ${newStatus}`;

        // Hide dropdown
        dropdown.querySelector('.status-options').style.display = 'none';

        // Send PATCH request
        showLoader();
        try {
            const res = await fetch(`/api/houses/${houseId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();
            if(!res.ok){
                alert(data.message || "Failed to update status");
                console.error("Status update error:", data);
                await loadMyListings(); // revert changes visually if failed
            }
        } catch(err){
            console.error("Fetch error:", err);
            alert("Failed to update status");
            await loadMyListings(); // revert changes visually if failed
        } finally {
            hideLoader();
        }
    }
});

// Close dropdowns if clicked outside
document.addEventListener('click', e => {
    if(!e.target.closest('.status-dropdown')){
        document.querySelectorAll('.status-options').forEach(opt => opt.style.display = 'none');
    }
});


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

// ================== INITIAL LOAD ==================
loadMyListings();