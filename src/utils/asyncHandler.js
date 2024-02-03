//Method 1 : With Promises 
const asyncHandler = async(requestHandler) =>{
    return (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

/*
//Method 2 : With Try Catch

const asyncHandler = (func) => async (req,res,next) => {
    try {
        await func(req,res,next);
    } catch (error) {
        res.status(error.code || 500).json({
            suzzess:false,
            message:error.message
        })
    }
}
*/
export  {asyncHandler};