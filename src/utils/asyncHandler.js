// //Method 1 : With Promises //Not Working For me as it is giving error
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};


// //Method 2 : With Try Catch

// const asyncHandler = (func) => async (req,res,next) => {
//     try {
//         await func(req,res,next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }

export { asyncHandler };

