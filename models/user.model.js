import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isAccountVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpiry: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 mins expiry
    },
    otp: String,
    otpExpiry: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 mins expiry
    },
    isActive: {
        type: Boolean,
        default: true
    },
    refreshToken: String
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = async function () {
    return jwt.sign({ userId: this._id, userRole: this.role }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    })
}

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign({ userId: this._id, userRole: this.role }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    })
}

const User = mongoose.models.user || mongoose.model("User", userSchema);
export default User;