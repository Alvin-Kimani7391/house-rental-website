// ================== INIT ==================
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) console.warn("No user or token found.");

const API_URL = window.location.origin + "/api/auth";
let uploadedImage = "";

// ================== LOAD PROFILE ==================
async function loadProfile() {
    try {
        const res = await fetch(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        document.getElementById('navName').innerText = data.name;
        document.getElementById('navRole').innerText = data.role;

        document.getElementById('profileName').innerText = data.name;
        document.getElementById('profileMeta').innerText =
            `${data.email} • Joined ${new Date(data.createdAt).getFullYear()}`;

        // ================= NEW: PHONE + LOCATION =================
        const contact = [];
        if (data.phone) contact.push(`📞 ${data.phone}`);
        if (data.location) contact.push(`📍 ${data.location}`);

        // ================= CONTACT UI =================
const contactEl = document.getElementById('profileContact');

if (contactEl) {
    let html = "";

    if (data.phone) {
    html += `
        <a href="tel:${data.phone}" class="contact-pill">
            <span>📞</span> ${data.phone}
        </a>
    `;
}

    if (data.location) {
        html += `
            <div class="contact-pill">
                <span>📍</span> ${data.location}
            </div>
        `;
    }

    contactEl.innerHTML = html || `<div class="contact-pill">No contact details</div>`;
}
        // =======================================================
        
        
            document.getElementById('profileBio').innerText = data.bio || "No bio added yet.";

        const profileImage = document.getElementById('profileImage');
        profileImage.src = data.profileImage || '/images/default-avatar.png';
        uploadedImage = data.profileImage || "";

        const completion = data.profileCompletion || 0;
        document.getElementById('completion').innerText = `${completion}% complete`;
        document.getElementById('progressBar').style.width = `${completion}%`;

        let missing = [];
        if (!data.bio) missing.push("Add bio");
        if (!data.location) missing.push("Add location");
        if (!data.phone) missing.push("Add phone");
        if (!data.profileImage) missing.push("Upload photo");

        const tips = document.getElementById('profileTips');
        if (tips && missing.length > 0) tips.innerText = "Complete your profile: " + missing.join(", ");

        if (data.role === 'agent') document.getElementById('agentFields').style.display = 'block';
        if (data.role === 'owner') document.getElementById('ownerFields').style.display = 'block';

        // ================= VERIFICATION =================
        const statusEl = document.getElementById('status');
        const badge = document.getElementById('verifiedBadge');
        const verificationForm = document.getElementById('verificationForm');

        if (data.role !== 'agent' && data.role !== 'owner') {
            if (verificationForm) verificationForm.style.display = 'none';
            if (statusEl) statusEl.style.display = 'none';
        } else {
            const status = data.verification?.status || 'unverified';

            verificationForm.style.display = 'block';
            statusEl.style.display = 'inline-block';

            if (status === 'approved') {
                statusEl.className = 'status-pill status-approved';
                statusEl.innerText = 'Verified ✅';
                badge.style.display = 'block';
                verificationForm.style.display = 'none';
            } else if (status === 'pending') {
                statusEl.className = 'status-pill status-pending';
                statusEl.innerText = 'Pending ⏳';
                verificationForm.style.display = 'none';
            } else if (status === 'rejected') {
                statusEl.className = 'status-pill status-rejected';
                statusEl.innerText = 'Rejected ❌ - Try again';
            } else {
                statusEl.className = 'status-pill';
                statusEl.innerText = 'Not Verified';
            }

            const agentField = document.getElementById('agentProofField');
            const ownerField = document.getElementById('landDocumentField');

            if (data.role === 'agent') {
                if (agentField) agentField.style.display = 'block';
                if (ownerField) ownerField.style.display = 'none';
            }
            if (data.role === 'owner') {
                if (ownerField) ownerField.style.display = 'block';
                if (agentField) agentField.style.display = 'none';
            }
        }

        document.getElementById('listingsCount').innerText = data.listings?.length || 0;
        document.getElementById('savedCount').innerText = data.savedListings?.length || 0;
        document.getElementById('rating').innerText = `${data.rating || 0}⭐`;

    } catch (err) {
        console.error('Profile load error:', err);
    }
}




// ================== LOAD MY LISTINGS (PRO FINAL) ==================
async function loadMyListings() {
    const container = document.getElementById("dashboardGrid");
    const countEl = document.getElementById("listingCount");

    if (!container) return;

    try {
        container.innerHTML = "<p>Loading listings...</p>";

        const res = await fetch("/api/houses/my/listings", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const houses = await res.json();
        countEl.innerText = houses.length;

        if (!houses.length) {
            container.innerHTML = `<p style="color:#777;">No listings yet.</p>`;
            return;
        }

        container.innerHTML = "";

        houses.forEach(house => {
            const firstImage =
                house.images?.[0]?.url ||
                house.images?.[0] ||
                "https://via.placeholder.com/300";

            const isSaved = house.isSaved || false;
            const views = house.views || 0;

            const card = document.createElement("div");
            card.className = "dashboard-card";

            card.innerHTML = `
                <div class="card-image">
                    <img src="${firstImage}" alt="${house.title}">
                    
                    <div class="card-overlay">
                        <button class="edit-btn" data-id="${house._id}">✏️</button>
                        <button class="save-btn ${isSaved ? 'saved' : ''}" data-id="${house._id}">
                            ${isSaved ? '❤️' : '🤍'}
                        </button>
                    </div>

                    <span class="status-badge ${house.status}">
                        ${house.status || "available"}
                    </span>
                </div>

                <div class="card-body">
                    <h3>${house.title}</h3>
                    <p class="location">📍 ${house.location}</p>
                    <p class="price">KSh ${house.price}</p>

                    <div class="card-stats">
                        <span>👁️ ${views}</span>
                        <span>⭐ ${house.favorites || 0}</span>
                    </div>
                </div>
            `;

            // 👉 OPEN LISTING
            card.addEventListener("click", () => {
                window.location.href = `/listing.html?id=${house._id}`;
            });

            // 👉 EDIT
            card.querySelector(".edit-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                window.location.href = `/edit-listing.html?id=${house._id}`;
            });

            // 👉 SAVE / FAVORITE
            const saveBtn = card.querySelector(".save-btn");
            saveBtn.addEventListener("click", async (e) => {
                e.stopPropagation();

                try {
                    const res = await fetch(`/api/houses/${house._id}/save`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const data = await res.json();

                    // toggle UI instantly
                    saveBtn.classList.toggle("saved");
                    saveBtn.innerText = saveBtn.classList.contains("saved") ? "❤️" : "🤍";

                } catch (err) {
                    console.error("Save failed", err);
                }
            });

            container.appendChild(card);
        });

    } catch (err) {
        console.error("Error loading listings:", err);
        container.innerHTML = "<p>Error loading listings.</p>";
    }
}

loadProfile();
loadMyListings();
loadSavedListings().then(updateStats);// <-- add this

// ================= PROFILE IMAGE UPLOAD =================
const imageInput = document.getElementById('imageInput');

if (imageInput) {
    imageInput.addEventListener('change', async () => {
        const file = imageInput.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return alert('Only images allowed');
        if (file.size > 5 * 1024 * 1024) return alert('Max 5MB');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${window.location.origin}/api/upload/profile-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.imageUrl) {
                uploadedImage = data.imageUrl;
                document.getElementById('profileImage').src = uploadedImage;
            }
        } catch (err) {
            console.error("Image upload failed:", err);
            alert("Image upload failed");
        }
    });
}

// ================= EDIT BIO =================
const editBtn = document.getElementById('editBioBtn');
const bioText = document.getElementById('profileBio');
const bioInput = document.getElementById('bioInput');

editBtn.addEventListener('click', async () => {
    if (bioInput.classList.contains('hidden')) {
        bioInput.classList.remove('hidden');
        bioInput.value = bioText.innerText;
        bioText.style.display = 'none';
        editBtn.innerText = "Save Bio";
    } else {
        try {
            await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ bio: bioInput.value, profileImage: uploadedImage })
            });

            bioText.innerText = bioInput.value;
            bioText.style.display = 'block';
            bioInput.classList.add('hidden');
            editBtn.innerText = "Edit Bio";
            loadProfile();
        } catch (err) {
            console.error("Failed to save bio:", err);
            alert("Failed to save bio");
        }
    }
});

// ================= DOCUMENT UPLOAD HELPER =================
async function uploadDocument(file, type) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type); // send type to backend

    const res = await fetch(`${window.location.origin}/api/upload/verification-doc`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });

    const data = await res.json();
    if (!data.url) throw new Error("Upload failed");
    return data.url;
}


async function loadSavedListings() {
    const container = document.getElementById("savedGrid");
    const countEl = document.getElementById("savedCount");
    if (!container) return;

    try {
        const res = await fetch("/api/houses/saved", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const savedHouses = await res.json();
        countEl.innerText = savedHouses.length;

        if (!savedHouses.length) {
            container.innerHTML = "<p>No saved listings yet.</p>";
            return;
        }

        container.innerHTML = "";
        savedHouses.forEach(house => {
            const card = document.createElement("div");
            card.className = "dashboard-card";
            const img = house.images?.[0] || "/images/default-house.png";
            card.innerHTML = `
                <div class="card-image">
                    <img src="${img}" alt="${house.title}">
                    <span class="status-badge ${house.status || 'available'}">
                        ${house.status?.toUpperCase() || 'AVAILABLE'}
                    </span>
                </div>
                <div class="card-body">
                    <h3>${house.title}</h3>
                    <p>📍 ${house.location}</p>
                    <p>KSh ${house.price}</p>
                </div>
            `;
            card.addEventListener("click", () => {
                window.location.href = `/listing.html?id=${house._id}`;
            });
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading saved listings.</p>";
    }
}

async function updateStats() {
    const listingsCountEl = document.getElementById("listingsCount");
    const savedCountEl = document.getElementById("savedCount");

    try {
        // Get listings count
        const listingsRes = await fetch("/api/houses/my/listings", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const listings = await listingsRes.json();
        listingsCountEl.innerText = listings.length;

        // Use already loaded saved listings in the DOM
        const savedContainer = document.getElementById("savedGrid");
        if (savedContainer) {
            savedCountEl.innerText = savedContainer.children.length;
        }

    } catch (err) {
        console.error("Failed to update stats:", err);
        listingsCountEl.innerText = 0;
        savedCountEl.innerText = 0;
    }
}

// ================= VERIFY FORM =================
const verificationForm = document.getElementById('verificationForm');

if (verificationForm) {
    verificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            alert("Uploading documents...");

            const files = {
                nationalId: verificationForm.nationalId?.files[0],
                agentProof: verificationForm.agentProof?.files[0],
                utilityBill: verificationForm.utilityBill?.files[0],
                landDocument: verificationForm.landDocument?.files[0]
            };

            const uploadPromises = Object.entries(files).map(async ([key, file]) => {
                if (!file) return [key, null];
                const url = await uploadDocument(file, key);
                return [key, url];
            });

            const results = await Promise.all(uploadPromises);
            const urls = Object.fromEntries(results);

            const res = await fetch(`${API_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(urls)
            });

            const data = await res.json();
            alert(data.message);
            loadProfile();

        } catch (err) {
            console.error("Verification failed:", err);
            alert("Verification submission failed");
        }
    });
}