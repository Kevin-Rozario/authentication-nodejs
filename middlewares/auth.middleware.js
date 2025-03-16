import jwt from "jsonwebtoken";
import { asyncHandler } from "./asyncHandler.middleware.js";
import { ApiError } from "../utils/apiError.js";

const auth = asyncHandler(async (req, res, next) => {
    // get access and refresh tokens from the request
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // check their presence 
    if (!accessToken && !refreshToken) {
        throw new ApiError(401, "Access Denied!", ["accessToken", "refreshToken"]);
    }

    // decode the access token
    try {
        const decoded = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        throw new ApiError(401, "Access token expired!", ["accessToken"]);
    }
});

export default auth;