const token = localStorage.getItem("token");

if(!token){

window.location.href = "/admin-login.html";

}

async function loadStats(){

const token = localStorage.getItem("token");

const res = await fetch("/api/admin/stats",{

headers:{
Authorization: `Bearer ${token}`
}

});

const data = await res.json();

document.getElementById("usersCount").innerText = data.users;
document.getElementById("agentsCount").innerText = data.agents;
document.getElementById("ownersCount").innerText = data.owners;
document.getElementById("housesCount").innerText = data.houses;

}

loadStats();


// ================= USERS =================

async function loadUsers() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/users", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const users = await res.json();
    let html = `
        <h2>Users</h2>
        <table>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
            </tr>
    `;

    users.forEach(user => {
        html += `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
            </tr>
        `;
    });

    html += "</table>";
    document.getElementById("dataSection").innerHTML = html;
}


// ================= AGENTS =================

async function loadAgents() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/agents", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const agents = await res.json();
    let html = "<h2>Agents</h2>";

    agents.forEach(a => {
        html += `<h3>${a.agent.name}</h3>`;
        html += `
            <table>
                <tr>
                    <th>House</th>
                    <th>Location</th>
                    <th>Status</th>
                </tr>
        `;

        a.houses.forEach(h => {
            html += `
                <tr>
                    <td>${h.title}</td>
                    <td>${h.location}</td>
                    <td><span class="status ${h.status.toLowerCase()}">${h.status}</span></td>
                </tr>
            `;
        });

        html += "</table>";
    });

    document.getElementById("dataSection").innerHTML = html;
}


// ================= OWNERS =================

async function loadOwners() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/owners", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const owners = await res.json();
    let html = "<h2>Owners & Their Houses</h2>";

    owners.forEach(o => {
        html += `<h3>${o.owner.name}</h3>`;
        if (o.houses.length > 0) {
            html += `
                <table>
                    <tr>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Status</th>
                    </tr>
            `;
            o.houses.forEach(h => {
                html += `
                    <tr>
                        <td>${h.title}</td>
                        <td>${h.location}</td>
                        <td><span class="status ${h.status.toLowerCase()}">${h.status}</span></td>
                    </tr>
                `;
            });
            html += "</table>";
        } else {
            html += "<p>No houses assigned</p>";
        }
    });

    document.getElementById("dataSection").innerHTML = html;
}

function logout(){

localStorage.removeItem("token");

window.location.href="/admin-login.html";

}

// ================= HOUSES =================

async function loadHouses() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/houses", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const houses = await res.json();
    let html = `
        <h2>All Houses</h2>
        <table>
            <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Status</th>
                <th>Owner</th>
            </tr>
    `;

    houses.forEach(h => {
        html += `
            <tr>
                <td>${h.title}</td>
                <td>${h.location}</td>
                <td><span class="status ${h.status.toLowerCase()}">${h.status}</span></td>
                <td>${h.owner?.name}</td>
                <td>
                <button class="delete-btn" onclick="deleteHouse('${h._id}')">Delete</button>
            </td>
            </tr>
        `;
    });

    html += "</table>";
    document.getElementById("dataSection").innerHTML = html;
}

async function deleteHouse(houseId) {
  const token = localStorage.getItem("token");
  if (!confirm("Are you sure you want to delete this house?")) return;

  const res = await fetch(`/api/houses/${houseId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();
  if (res.ok) {
    alert(data.message);
    loadHouses(); // refresh table
  } else {
    alert(data.message || "Failed to delete house");
  }
}