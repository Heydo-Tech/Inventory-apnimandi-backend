const express = require("express");
const mongoose = require("mongoose");
const app = express();

// MongoDB connection URI
const mongoURI = "mongodb+srv://vishalaggarwal270:Nvy1HI7eJ2guvoEN@barcodeproject.d43bd.mongodb.net/mydatabase"; // Replace 'mydatabase' with your database name


const connectDb=async()=>{

    // Connect to MongoDB
    mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log("MongoDB connected"))
        .catch(err => console.log("MongoDB connection error:", err));
        
}
    

module.exports=connectDb