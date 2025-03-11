import mongoose from "mongoose";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MongoDB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ MongoDB Connected...");
    } catch (e) { // ✅ Corrected error handling
        console.error("❌ MongoDB Connection Error:", e.message);
        process.exit(1); 
    }
}

export default connectDb;
