import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    
    // get user details from frontend
    const {fullname,email,password,username} = req.body;
    
    // validation - not empty
    if(
        [fullname,username,email,password].some((fields)=>fields?.trim() === "")
        ){
            throw ApiError(400,"Please Enter Valid Details!!!")
        }
        
    // check if user already exists: username, email
    const existance = User.findOne({
        $or: [{email},{username}]
    })

    console.log("Existance of a user in Database : ",existance)

    if(existance){
        throw ApiError(409,"User with same username or email already exists!!!");
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0].path;
    const coverImageLocalPath = req.files?.coverImage[0].path;
    console.log("Files : ",req.files,"\n");
    console.log("Avatar : ",req.files?.avatar);
    console.log("CoverImage : ",req.files?.coverImage);
    console.log("AvatarLocalPath : ",avatarLocalPath);
    console.log("CoverImageLocalPath : ",coverImageLocalPath);

    if(!avatarLocalPath){
        throw ApiError(400,"Avatar Image is required.");
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    console.log("avatar after uploading on Cloudinary : ",avatar);
    console.log("coverImage after uploading on Cloudinary : ",coverImage);

    if(!avatar){
        throw ApiError(400,"Avatar Image is required.")
    }

    // create user object - create entry in db
    const newUser = await User.create({
        fullname,
        email,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        password,
        username:username.toLowerCase()
    })
    console.log("Creation of user :",user);

    // remove password and refresh token field from response
    const userCreated = await User.findById(newUser._id).select(
        "-password -refreshToken"
    )
    console.log("Removal of password and RefreshToken : ",userCreated);
    
    // check for user creation
    if(!userCreated){
        throw ApiError(500,"Something went wrong while registering the user..");
    }

    // return res

    return res.status(201).json(
        new ApiResponse(
            200,
            userCreated,
            "User Registered successfully"
        )
    );
        
});

export { registerUser };