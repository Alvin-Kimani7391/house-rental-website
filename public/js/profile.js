// ================== INIT ==================
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!user || !token) {
    console.warn("No user or token found.");
}

const API_URL = window.location.origin + "/api/auth";
let uploadedImage = "";

// ================== LOAD PROFILE ==================
async function loadProfile() {
    try {
        const res = await fetch(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        // ================= NAVBAR =================
        document.getElementById('navName').innerText = data.name;
        document.getElementById('navRole').innerText = data.role;

        // ================= PROFILE =================
        document.getElementById('profileName').innerText = data.name;
        document.getElementById('profileMeta').innerText =
            `${data.email} • Joined ${new Date(data.createdAt).getFullYear()}`;

        document.getElementById('profileBio').innerText =
            data.bio || "No bio added yet.";

        const profileImage = document.getElementById('profileImage');
        profileImage.src = data.profileImage || '/images/default-avatar.png';
        uploadedImage = data.profileImage || "";

        // ================= PROGRESS =================
        const completion = data.profileCompletion || 0;
        document.getElementById('completion').innerText = `${completion}% complete`;
        document.getElementById('progressBar').style.width = `${completion}%`;

        // ================= PROFILE TIPS =================
        let missing = [];
        if (!data.bio) missing.push("Add bio");
        if (!data.location) missing.push("Add location");
        if (!data.phone) missing.push("Add phone");
        if (!data.profileImage) missing.push("Upload photo");

        const tips = document.getElementById('profileTips');
        if (tips && missing.length > 0) {
            tips.innerText = "Complete your profile: " + missing.join(", ");
        }

        // ================= ROLE UI =================
        if (data.role === 'agent') {
            document.getElementById('agentFields').style.display = 'block';
        }

        if (data.role === 'owner') {
            document.getElementById('ownerFields').style.display = 'block';
        }

        // ================= VERIFICATION =================
        const statusEl = document.getElementById('status');
        const badge = document.getElementById('verifiedBadge');
        const verificationForm = document.getElementById('verificationForm');

        // 🚨 Restrict verification to agent & owner ONLY
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
            }
            else if (status === 'pending') {
                statusEl.className = 'status-pill status-pending';
                statusEl.innerText = 'Pending ⏳';
                verificationForm.style.display = 'none';
            }
            else if (status === 'rejected') {
                statusEl.className = 'status-pill status-rejected';
                statusEl.innerText = 'Rejected ❌ - Try again';
            }
            else {
                statusEl.className = 'status-pill';
                statusEl.innerText = 'Not Verified';
            }

            // ✅ Optional: role-based document fields
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

        // ================= STATS =================
        document.getElementById('listingsCount').innerText = data.listings?.length || 0;
        document.getElementById('savedCount').innerText = data.savedListings?.length || 0;
        document.getElementById('rating').innerText = `${data.rating || 0}⭐`;

    } catch (err) {
        console.error('Profile load error:', err);
    }
}

loadProfile();

// ================= CLOUDINARY UPLOAD =================
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
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    bio: bioInput.value,
                    profileImage: uploadedImage
                })
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

// ================= FILE → BASE64 =================
const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
});

// ================= VERIFY =================
const verificationForm = document.getElementById('verificationForm');

if (verificationForm) {
    verificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nationalId = verificationForm.nationalId?.files[0]
            ? await toBase64(verificationForm.nationalId.files[0])
            : null;

        const agentProof = verificationForm.agentProof?.files[0]
            ? await toBase64(verificationForm.agentProof.files[0])
            : null;

        const utilityBill = verificationForm.utilityBill?.files[0]
            ? await toBase64(verificationForm.utilityBill.files[0])
            : null;

        const landDocument = verificationForm.landDocument?.files[0]
            ? await toBase64(verificationForm.landDocument.files[0])
            : null;

        try {
            const res = await fetch(`${API_URL}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    nationalId,
                    agentProof,
                    utilityBill,
                    landDocument
                })
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