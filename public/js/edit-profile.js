const token = localStorage.getItem('token');
let uploadedImage = "";

// Toast helper
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ================= LOAD CURRENT DATA =================
async function loadUser() {
    try {
        const res = await fetch('/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        document.getElementById('name').value = data.name || "";
        document.getElementById('phone').value = data.phone || "";
        document.getElementById('location').value = data.location || "";
        document.getElementById('bio').value = data.bio || "";

        document.getElementById('previewImage').src = data.profileImage || '/images/default-avatar.png';
        uploadedImage = data.profileImage;
    } catch (err) {
        console.error(err);
        showToast('Failed to load profile');
    }
}

loadUser();

// ================= CLOUDINARY UPLOAD =================
const imageInput = document.getElementById('imageInput');
const progressBar = document.getElementById('progressBar');

imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return showToast('No file selected');
    if (!file.type.startsWith('image/')) return showToast('Only images allowed');
    if (file.size > 5 * 1024 * 1024) return showToast('Max 5MB');

    const formData = new FormData();
    formData.append('image', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/profile-image', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            progressBar.style.width = `${percent}%`;
        }
    };

    xhr.onload = () => {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            uploadedImage = data.imageUrl;
            document.getElementById('previewImage').src = uploadedImage;
            progressBar.style.width = '0%';
            showToast('Image uploaded ✅');
        } else {
            showToast('Upload failed ❌');
            progressBar.style.width = '0%';
        }
    };

    xhr.onerror = () => {
        showToast('Upload error ❌');
        progressBar.style.width = '0%';
    };

    xhr.send(formData);
});

// ================= UPDATE PROFILE =================
document.getElementById('saveBtn').addEventListener('click', async () => {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;

    const body = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        bio: document.getElementById('bio').value,
        profileImage: uploadedImage
    };

    try {
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        showToast('Profile updated ✅');
        setTimeout(() => window.location.href = "/profile.html", 1000);
    } catch (err) {
        console.error(err);
        showToast('Update failed ❌');
    } finally {
        saveBtn.disabled = false;
    }
});