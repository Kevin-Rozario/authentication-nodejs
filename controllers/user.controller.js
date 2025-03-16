import ApiResponse from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import sendEmail from "../services/email.service.js";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import jwt from "jsonwebtoken";
import generateEmailToken from "../services/generateEmailToken.service.js";

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
    const verificationToken = generateEmailToken();
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
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(400, "Invalid credentials", ["email", "password"]);
    }

    // check if the user is verified
    if (!user.isAccountVerified) {
        throw new ApiError(403, "Account not verified!", ["email"]);
    }

    // generate access and refresh tokens store it in the database
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    // set tokens as cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    }
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    // send response
    const loggedInUser = await User.findOne({ email: user.email }).select("-password");
    return res.status(200).json(new ApiResponse(200, loggedInUser, "User logged in successfully!"));
});

export const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new ApiError(401, "Unauthorized: No user found in request!", ["userId"]);
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found!", ["userId"]);
    }

    // Clear refresh token from the database
    user.refreshToken = undefined;
    await user.save();

    // Clear cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    // Send response
    return res.status(200).json(new ApiResponse(200, null, "User logged out successfully!"));
});


export const resetPassword = (req, res) => {

};

export const renewRefreshToken = asyncHandler(async (req, res) => {
    // Get refresh token from request cookies
    const refreshToken = req.cookies.refreshToken;

    // Validate presence
    if (!refreshToken) {
        throw new ApiError(401, "Refresh token required!", ["refreshToken"]);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userId = decoded?.userId;

    // Fetch user
    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new ApiError(401, "Invalid refresh token", ["refreshToken"]);
    }

    // Ensure refresh token matches the one stored in DB
    if (refreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token expired or used", ["refreshToken"]);
    }

    // Generate new tokens
    const newAccessToken = await user.generateAccessToken();
    const newRefreshToken = await user.generateRefreshToken();

    // Save new refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save();

    // Cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    };

    // Set new tokens in cookies
    res.cookie("accessToken", newAccessToken, cookieOptions); // 15 minutes
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    // Send response
    res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, "Access token refreshed!"));
});

export const getProfile = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError(401, "Unauthorised request");
    };

    const foundUser = await User.findOne({ _id: userId }).select("-_id -password -refreshToken -role");
    if (!foundUser) {
        throw new ApiError(404, "User not found!", ["userId"]);
    };

    res.status(200).json(new ApiResponse(200, foundUser, "User fetched succssfully!"));
})