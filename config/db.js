import mongoose from "mongoose";
const connectDb = async() =>{
    try{
        await mongoose.connect(process.env.MongoDB_URI);
        console.log("Mongo db Connected...")
    }
    catch(e){
        console.error("MongoDB Connection Error:", error);
        process.exit(1); 
    }
}

export default connectDb;