// ================= TOKEN CHECK =================
const token = localStorage.getItem("token");
if (!token) window.location.href = "/admin-login.html";

// ================= LOGOUT =================
function logout() {
    localStorage.removeItem("token");
    window.location.href = "/admin-login.html";
}
window.logout = logout;

// ================= FETCH HELPERS =================
async function fetchAPI(url, options = {}) {
    options.headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
    const res = await fetch(url, options);
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Request failed: ${res.status} ${errText}`);
    }
    return res.json();
}

// ================= STATS =================
async function loadStats() {
    try {
        const data = await fetchAPI("/api/admin/stats");
        document.getElementById("usersCount").innerText = data.users;
        document.getElementById("agentsCount").innerText = data.agents;
        document.getElementById("ownersCount").innerText = data.owners;
        document.getElementById("housesCount").innerText = data.houses;
    } catch (err) {
        console.error("Failed to load stats:", err);
    }
}
window.loadStats = loadStats;
loadStats();

// ================= USERS =================
async function loadUsers() {
    try {
        const users = await fetchAPI("/api/admin/users");
        if (!Array.isArray(users)) throw new Error("Expected array of users");

        let html = `<h2>Users</h2>
            <table>
                <tr><th>Name</th><th>Email</th><th>Role</th></tr>`;
        users.forEach(u => {
            html += `<tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
            </tr>`;
        });
        html += "</table>";
        document.getElementById("dataSection").innerHTML = html;
    } catch (err) {
        console.error("Failed to load users:", err);
        document.getElementById("dataSection").innerHTML = "<p>Error loading users.</p>";
    }
}
window.loadUsers = loadUsers;

// ================= AGENTS =================
async function loadAgents() {
    try {
        const agents = await fetchAPI("/api/admin/agents");
        if (!Array.isArray(agents)) throw new Error("Expected array of agents");

        let html = "<h2>Agents</h2>";
        agents.forEach(a => {
            html += `<h3>${a.agent.name}</h3>
                <table>
                    <tr><th>House</th><th>Location</th><th>Status</th></tr>`;
            a.houses.forEach(h => {
                html += `<tr>
                    <td>${h.title}</td>
                    <td>${h.location}</td>
                    <td><span class="status ${h.status.toLowerCase()}">${h.status}</span></td>
                </tr>`;
            });
            html += "</table>";
        });

        document.getElementById("dataSection").innerHTML = html;
    } catch (err) {
        console.error("Failed to load agents:", err);
        document.getElementById("dataSection").innerHTML = "<p>Error loading agents.</p>";
    }
}
window.loadAgents = loadAgents;

// ================= OWNERS =================
async function loadOwners() {
    try {
        const owners = await fetchAPI("/api/admin/owners");
        if (!Array.isArray(owners)) throw new Error("Expected array of owners");

        let html = "<h2>Owners & Their Houses</h2>";
        owners.forEach(o => {
            html += `<h3>${o.owner.name}</h3>`;
            if (o.houses.length > 0) {
                html += `<table>
                    <tr><th>Title</th><th>Location</th><th>Status</th></tr>`;
                o.houses.forEach(h => {
                    html += `<tr>
                        <td>${h.title}</td>
                        <td>${h.location}</td>
                        <td><span class="status ${h.status.toLowerCase()}">${h.status}</span></td>
                    </tr>`;
                });
                html += "</table>";
            } else {
                html += "<p>No houses assigned</p>";
            }
        });

        document.getElementById("dataSection").innerHTML = html;
    } catch (err) {
        console.error("Failed to load owners:", err);
        document.getElementById("dataSection").innerHTML = "<p>Error loading owners.</p>";
    }
}
window.loadOwners = loadOwners;

// ================= HOUSES =================
async function loadHouses() {
    try {
        const houses = await fetchAPI("/api/admin/houses");
        if (!Array.isArray(houses)) throw new Error("Expected array of houses");

        let html = `<h2>All Houses</h2>
            <table>
                <tr><th>Title</th><th>Location</th><th>Status</th><th>Owner</th><th>Action</th></tr>`;
        houses.forEach(h => {
            html += `<tr>
                <td>${h.title}</td>
                <td>${h.location}</td>
                <td><span class="status ${h.status.toLowerCase()}">${h.status}</span></td>
                <td>${h.owner?.name || "N/A"}</td>
                <td><button class="delete-btn" onclick="deleteHouse('${h._id}')">Delete</button></td>
            </tr>`;
        });
        html += "</table>";
        document.getElementById("dataSection").innerHTML = html;
    } catch (err) {
        console.error("Failed to load houses:", err);
        document.getElementById("dataSection").innerHTML = "<p>Error loading houses.</p>";
    }
}
window.loadHouses = loadHouses;

async function deleteHouse(houseId) {
    if (!confirm("Are you sure you want to delete this house?")) return;
    try {
        const data = await fetchAPI(`/api/houses/${houseId}`, { method: 'DELETE' });
        alert(data.message);
        loadHouses();
    } catch (err) {
        console.error("Failed to delete house:", err);
        alert("Failed to delete house");
    }
}

// ================= VERIFICATIONS =================
async function loadVerifications() {
    try {
        const users = await fetchAPI("/api/admin/verifications");
        if (!Array.isArray(users)) throw new Error("Expected array of verifications");

        let html = "<h2>User Verifications</h2>";
        if (!users.length) html += "<p>No verifications pending.</p>";

        users.forEach(u => {
            const docs = u.verification?.documents || {};

            html += `<div class="verification-card">
                <h3>${u.name} (${u.role})</h3>
                <p>Status: <strong>${u.verification?.status || 'unverified'}</strong></p>
                <p>Email: ${u.email}</p>
                <div class="docs">`;

            // Download buttons
            Object.entries(docs).forEach(([key, url]) => {
                if (typeof url === "string" && url.trim() !== "") {
                    const filename = `${key.replace(/([A-Z])/g, ' $1')}.pdf`;
                    html += `<button onclick="downloadDoc('${u._id}', '${key}', '${filename}')">${key.replace(/([A-Z])/g, ' $1')}</button> `;
                }
            });

            html += `</div>
                <button onclick="updateVerification('${u._id}', 'approved')">Approve ✅</button>
                <button onclick="updateVerification('${u._id}', 'rejected')">Reject ❌</button>
            </div>`;
        });

        document.getElementById("dataSection").innerHTML = html;
    } catch (err) {
        console.error("Failed to load verifications:", err);
        document.getElementById("dataSection").innerHTML = "<p>Error loading verifications.</p>";
    }
}
window.loadVerifications = loadVerifications;

// ================= DOCUMENT DOWNLOAD HELPER =================
async function downloadDoc(userId, docKey) {
  try {
    const res = await fetch(`/api/admin/doc/${userId}/${docKey}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Failed to fetch document: ${res.statusText}`);

    const blob = await res.blob();

    // Try to extract filename from Content-Disposition
    let filename = "document";
    const disposition = res.headers.get("Content-Disposition");
    if (disposition && disposition.includes("filename=")) {
      filename = disposition.split("filename=")[1].replace(/"/g, "");
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download error:", err);
    alert("Failed to download document");
  }
}
window.downloadDoc = downloadDoc;

// ================= UPDATE VERIFICATION =================
async function updateVerification(userId, status) {
    if (!confirm(`Are you sure you want to ${status} this verification?`)) return;
    try {
        const data = await fetchAPI(`/api/admin/verify/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
            headers: { 'Content-Type': 'application/json' }
        });
        alert(data.message);
        loadVerifications();
    } catch (err) {
        console.error("Failed to update verification:", err);
        alert("Action failed");
    }
}
window.updateVerification = updateVerification;