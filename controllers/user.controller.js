import ApiResponse from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import sendEmail from "../services/email.service.js";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";

export const registerUser = asyncHandler(async (req, res) => {
    // Extract data from request
    const { email, name, password } = req.body;

    // Validate input
    if (!email || !password || !name) {
        throw new ApiError(400, "All fields are required", ["email", "name", "password"]);
    }

    // Check if user already exists
    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(400, "User already exists!", ["email"]);
    }

    // Create a new user in the database
    const user = await User.create({ email, name, password });

    if (!user) {
        throw new ApiError(500, "User creation failed", ["database error"]);
    }

    // Generate a verification token and store it in the user document
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
    await user.save();

    // Send verification email
    const emailSent = await sendEmail(user);
    if (!emailSent) {
        throw new ApiError(500, "Failed to send verification email", ["email service error"]);
    }

    // Send success response without password
    const registeredUser = await User.findOne({ email: user.email }).select("-password");
    res.status(201).json(new ApiResponse(201, registeredUser, "User registered successfully!"));
});

export const verifyUser = (req, res) => {

};

export const loginUser = (req, res) => {

};

export const logoutUser = (req, res) => {

};

export const resetPassword = (req, res) => {

};