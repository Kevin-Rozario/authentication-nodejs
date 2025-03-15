import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/user.route.js";
import dbConnect from "./config/db.config.js"

const app = express();
const port = process.env.PORT || 4000;

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "*",
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}))


// routes
dbConnect();
app.get("/", (req, res) => {
    res.send("Authentication in NodeJS!")
});
app.use("/api/v1/users", userRoutes);


app.listen(port, () => console.log(`Server is running on port ${port}`));