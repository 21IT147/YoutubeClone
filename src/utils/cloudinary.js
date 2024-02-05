import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{

    try {
        if(!localFilePath) return null;

        //file upload on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        //file has been uploaded successfully on cloudinary
        console.log(`File is Addded to Cloudinary : ${response.url}`)  
        fs.unlinkSync(localFilePath); //remove file from local enviornment after successfully uploading it to cloudinary  
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //if there is any error then remove locally stored file 
        return null;
    }
}

export {uploadOnCloudinary};