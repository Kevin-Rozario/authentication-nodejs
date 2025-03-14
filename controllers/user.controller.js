import ApiResponse from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { asyncHandler } from "../utils/asyncHandler.js"

// TODO: Decide the role management

export const registerUser = asyncHandler(
    async (req, res) => {
        // get data
        const { email, name, password } = req.body;
        // validate
        if (!email || !password || !name) {
            throw new ApiError(400, "All fields required", "Bad Request");
        }
        // check if user exists
        const existedUser = await User.findOne({ email });

        if (existedUser) {
            throw new ApiError(400, "User already exists!", "Bad Request")
        }

        // create a user in database
        const user = await User.create({
            email,
            name,
            password,
        });

        if (!user) {
            throw new ApiError(400, "User creation failed", "Bad Request")
        }
        // send token as email to user
        const verificationToken = crypto.randomBytes(32).toString("hex");

        user.emailVerificationToken = verificationToken;
        await user.save()
        const emailStatus = sendEmail(user);
        if (!emailStatus) {
            throw new ApiError(500, "Something went wrong!", "Internal Server Error");
        }
        // send success status to the user
        const registeredUser = await User.findOne({ email: user.email }).select("-password");
        res.status(201).json(new ApiResponse(201, registeredUser, "User registered successfully!"));
    }
)

export const loginUser = (req, res) => {

};

export const logoutUser = (req, res) => {

};

export const resetPassword = (req, res) => {

};