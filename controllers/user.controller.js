import ApiResponse from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import sendEmail from "../services/email.service.js";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import generateTokens from "../services/generateTokens.service.js"

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

export const verifyUser = asyncHandler(async (req, res) => {
    // Get the verification token from request
    const token = req.query.token;

    // Check if token is provided
    if (!token) {
        throw new ApiError(401, "Verification token is missing", ["token"]);
    }

    // Find user with the verification token
    const user = await User.findOne({ verificationToken: token });

    // Handle invalid or expired token
    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token", ["token"]);
    }

    // Check if token is expired
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < Date.now()) {
        throw new ApiError(400, "Verification token has expired. Please request a new one.", ["token"]);
    }

    // Mark account as verified
    user.isAccountVerified = true;
    user.set({
        verificationToken: undefined,
        verificationTokenExpiry: undefined,
    });

    await user.save();

    // Send response with verified user
    const verifiedUser = await User.findOne({ email: user.email }).select("-password");
    return res.status(200).json(new ApiResponse(200, verifiedUser, "User verified successfully!"));
});


export const loginUser = asyncHandler(async (req, res) => {
    // get credentials from the request
    const { email, password } = req.body;

    // validate the credentials
    if (!email || !password) {
        throw new ApiError(400, "Email and password required!", ["email", "password"]);
    };

    // check if user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(400, "Invalid credentials", ["email", "password"]);
    }

    // check if the password match with password in database
    const isMatch = user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(400, "Invalid credentials", ["email", "password"]);
    }

    // check if the user is verified
    if (!user.isAccountVerified) {
        throw new ApiError(403, "Account not verified!", ["email"]);
    }

    // generate access and refresh tokens store it in the database
    const { accessToken, refreshToken } = generateTokens(user);
    user.set({
        accessToken,
        refreshToken,
    });
    await user.save();

    // set tokens as cookies
    res.setHeader("Authorization", `Bearer ${accessToken}`);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: true,
        maxAge: parseInt(process.env.REFRESH_COOKIE_MAXAGE, 10),
    });

    // send response
    const loggedInUser = await User.findOne({ email: user.email }).select("-password");
    return res.status(200).json(new ApiResponse(200, loggedInUser, "User logged in successfully!"));
});

export const logoutUser = (req, res) => {

};

export const resetPassword = (req, res) => {

};