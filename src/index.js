// require('dotenv').config({path:"./.env"});  {This also Works Perfectly}
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";
dotenv.config({
    path:"./.env"
})

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log(`Error : ${error}`)
        process.exit(1);
    })
    app.listen(process.env.PORT || 8080,()=>{
        console.log(`App is running on port no. ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log(`Error connecting to MongoDB Database !! ${error}`)
})

/*
Method 1: // Chaotic Method 
import express from "express";
import mongoose from "mongoose";
import {DB_NAME} from './constants.js';
const app = express();


;(async ()=>{
    try {
        await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.log(`Error : ${error}`);
            throw error;
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is Listening on port No. ${process.env.PORT}`);
        })

    } catch (error) {
        console.error(`Error : ${error}`);
        throw error;
    }
})()
*/