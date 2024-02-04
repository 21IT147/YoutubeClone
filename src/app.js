//File Configuration
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.json({limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//importing Routes
import userRoute from "../src/routes/user.routes.js";

//route Declaration
app.use("/api/v1/user",userRoute);

export {app}