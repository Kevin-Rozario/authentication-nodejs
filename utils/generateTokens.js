import jwt from "jsonwebtoken";

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user._id, userRole: user.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
    const refreshToken = jwt.sign(
        { userId: user._id, userRole: user.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
}

export default generateTokens;