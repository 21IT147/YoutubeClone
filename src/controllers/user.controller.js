import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false }); // Used this validateBeforeSave: false because Database validates each time it saves but herewe don't need that

  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullname, email, username, password } = req.body;
  //console.log("email: ", email);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log("Avatar : ", avatar.url);
  console.log("CoverImage : ", coverImage.url);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url == null ? "" : coverImage.url,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //take data from body

  const { email, username, password } = req.body;
  console.log(
    `Email : `,
    email,
    " Username : ",
    username,
    " Password : ",
    password
  );
  //validate data
  if ([email, username, password].some((fields) => fields.trim() === "")) {
    throw new ApiError(400, "USername or Password is required");
  }
  //check if user exists or not

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User with Email and Username doesnot exist.");
  }

  //check for password
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Credentials!!");
  }
  //send access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //send cookie
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User LoggedIn Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "User LoggedOut Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "Unauthorized User");
  }

  try {
    const decodedToken = jwt.verify(
      decodedToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh Token is Expired or used.");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access Token Refreshed"
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid RefreshToken");
  }
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  console.log(oldPassword)
  const user = await User.findById(req.user?._id);

  const verifyOldPassword = await user.isPasswordCorrect(oldPassword);

  if (!verifyOldPassword) {
    throw new ApiError(400, "Entered Old Password is Incorrect.");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        200,
        req.user,
        "User Data SEnd Successfully"
    )
});

const updateUserDetails = asyncHandler(async (req, res) => {

    try {
        const {username, fullname, email} = req.body;

        if(
            [username, fullname, email].some((fields)=>fields.trim() === "")
        ){
            throw new ApiError(400,"Please Enter All Details")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    fullname,
                    email,
                    password
                }
            },
            {
                new:true
            }
        ).select("-password -refreshToken");

        return res
        .status(200)
        .json(
            200,
            user,
            "Details Updated Successfully"
        );
    
    } catch (error) {
        throw new ApiError(500,error?.messsage || "Internal Server Error");
    }
    
});

const updateUserAvatar = asyncHandler(async(req,res)=>{

    try {
        const avatarPath = req.file?.path;
    
        if(!avatarPath){
            throw new ApiError(400,"No Avatar Image Uploaded");
        }
    
        const avatar = await uploadOnCloudinary(avatarPath);
    
        if(!avatar){
            throw new ApiError(400,"Avatar Image not uploaded on Cloudinary");
        }
    
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar:avatar.url
                }
            },
            {
                new:true
            }
        ).select("-password -refreshToken")
    
        return res
        .status(200)
        .json(
            200,
            user,
            "Avatar Image Updated Successfully"
        );
    } catch (error) {
        throw new ApiError(500,error?.message || "Internal Server Error")
    }

});

const updateUserCoverImage = asyncHandler(async(req,res)=>{

    try {
        const coverImagePath = req.file?.path;
    
        if(!coverImagePath){
            throw new ApiError(400,"No Avatar Image Uploaded");
        }
    
        const coverImage = await uploadOnCloudinary(coverImagePath);
    
        if(!coverImage){
            throw new ApiError(400,"Cover Image not uploaded on Cloudinary");
        }
    
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage:coverImage.url
                }
            },
            {
                new:true
            }
        ).select("-password -refreshToken")
    
        return res
        .status(200)
        .json(
            200,
            user,
            "Cover Image Updated Successfully"
        );
    } catch (error) {
        throw new ApiError(500,error?.message || "Internal Server Error")
    }

});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
