import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        index:true,//Used to make searching Easy in your database (It is a bit expensive but good for Searching purpose from Database)
        unique:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        unique:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true,
        index:true,
        trim:true
    },
    avatar:{
        type:String,  //cloudinary url
        required:true
    },
    coverimage:{
        type:String,  //cloudinary url
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,"Password is Required"]
    },
    refreshToken:{
        type:String
    }
},
{
    timestamps:true
}
);

//For hashing Password exactly before saving data to the Database.
userSchema.pre("save",async function (next){
    if(!this.password.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10);
    next();
})

//For Checking of password to be equal with use of bcrypt 
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(this.password,password);
}

//For Generating AccessToken
userSchema.methods.generateAccessToken = async function(){
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            username : this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:ACCESS_TOKEN_EXPIRY
        }
    )
}

//For Generating RefreshToken
userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema);