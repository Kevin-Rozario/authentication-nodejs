import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
        select: true
    },
    name: {
        type: String,
        lowercase: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    accessToken: {
        type: String,
        default: undefined,
    },
    refreshToken: {
        type: String,
        default: undefined,
    },
    resetPasswordToken: {
        type: String,
        expires: 60 * 10,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: {
        type: String,
        expires: 60 * 10,
    },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.models.user || mongoose.model("User", userSchema);
export default User;