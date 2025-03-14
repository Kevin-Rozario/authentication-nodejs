import mongoose from "mongoose";
import "dotenv/config"

const dbConnect = () => {
    mongoose.connect(process.env.DATABASE_URL).then(() =>
        console.log("Connected to MongDB successfully!")
    ).catch(() => {
        console.log("Error connecting to MongoDB!");
        process.exit(1);
    })
};

export default dbConnect;
