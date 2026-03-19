const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    role: {
        type: String,
        enum: ['user', 'agent', 'owner', 'admin'],
        default: 'user'
    },

    // ================= PROFILE =================
    profileImage: {
        type: String,
        default: '' // frontend handles fallback
    },

    bio: {
        type: String,
        trim: true,
        default: ''
    },

    location: {
        type: String,
        trim: true,
        default: ''
    },

    phone: {
        type: String,
        trim: true
    },

    isProfileComplete: {
        type: Boolean,
        default: false
    },

    // ================= VERIFICATION =================
    verified: {
        type: Boolean,
        default: false
    },

    verification: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: null // ✅ FIXED
        },
        documents: {
            nationalId: String,
            agentProof: String,
            utilityBill: String,
            landDocument: String
        }
    },

    // ================= RELATIONS =================
    listings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'House'
        }
    ],

    savedListings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'House'
        }
    ],

    // ================= EXTRA =================
    rating: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});


/* ================= HASH PASSWORD ================= */
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});


/* ================= MATCH PASSWORD ================= */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


/* ================= PROFILE COMPLETION ================= */
userSchema.methods.calculateProfileCompletion = function () {
    let score = 0;

    if (this.name) score += 20;
    if (this.bio) score += 20;
    if (this.location) score += 20;
    if (this.profileImage) score += 20;
    if (this.phone) score += 20;

    return score;
};

module.exports = mongoose.model('User', userSchema);