const express = require("express");
const router = express.Router();

const User = require("../models/User");
const House = require("../models/House");

const { protect } = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");


// ================= DASHBOARD STATS =================

router.get("/stats", protect, adminOnly, async (req, res) => {

try {

const users = await User.countDocuments({ role: "user" });
const agents = await User.countDocuments({ role: "agent" });
const owners = await User.countDocuments({ role: "owner" });

const houses = await House.countDocuments();

res.json({
users,
agents,
owners,
houses
});

} catch (err) {

res.status(500).json({ message: err.message });

}

});


// ================= USERS =================

router.get("/users", protect, adminOnly, async (req, res) => {

try {

const users = await User.find({ role: "user" }).select("-password");

res.json(users);

} catch (err) {

res.status(500).json({ message: err.message });

}

});


// ================= AGENTS =================

router.get("/agents", protect, adminOnly, async (req, res) => {

try {

const agents = await User.find({ role: "agent" });

const data = await Promise.all(

agents.map(async agent => {

const houses = await House.find({ owner: agent._id });

return {
agent,
houses
};

})

);

res.json(data);

} catch (err) {

res.status(500).json({ message: err.message });

}

});


// ================= OWNERS =================

router.get("/owners", protect, adminOnly, async (req, res) => {

try {

const owners = await User.find({ role: "owner" });

const data = await Promise.all(

owners.map(async owner => {

const houses = await House.find({ owner: owner._id });

return {
owner,
houses
};

})

);

res.json(data);

} catch (err) {

res.status(500).json({ message: err.message });

}

});


// ================= ALL HOUSES =================

router.get("/houses", protect, adminOnly, async (req, res) => {

try {

const houses = await House.find().populate("owner", "name email");

res.json(houses);

} catch (err) {

res.status(500).json({ message: err.message });

}

});


module.exports = router;