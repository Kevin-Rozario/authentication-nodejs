import crypto from "crypto";

const generateEmailToken = () => {
    return crypto.randomBytes(32).toString("hex");
}

export default generateEmailToken;