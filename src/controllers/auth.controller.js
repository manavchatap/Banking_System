const userModel = require ("../models/user.model")
const jwt = require ("jsonwebtoken")
const transporter = require ("../config/mail")
const tokenBlacklistModel = require ("../models/blackList.model")


async function userRegisterController (req,res) {

    const {email, password, name} = req.body

    const isExist = await userModel.findOne({
        email: email
    })
    if(isExist) {
        return res.status(422).json({
            message : "User already exists with this email",
            status : "Failed"
        })
    }
    const user = await userModel.create({
        email, password, name
    })

    await transporter.sendMail({
        from : process.env.EMAIL_USER,
        to : email,
        subject : "Welcome to Bank App",
        text : `Hi ${name}, Welcome to Bank App. Your account has been created successfully.`
    })

    const token = jwt.sign({userId : user._id}, process.env.JWT_SECRET, {expiresIn : "3d"})

    res.cookie("token",token)


    res.status(201).json({
        _id : user._id,
        email : user.email,
        name : user.name
    }
)
}

async function userLoginController (req,res) {

    const {email,password} = req.body

    const user = await userModel.findOne({email}).select("+password")  // password is not fetched by default, so we need to select it explicitly

    if(!user){
        return res.status(404).json({
            message : "Email is invalid"
        })
    }

    const isPasswordValid = await user.comparePassword(password)

    if(!isPasswordValid){
        return res.status(404).json({
            message : "Password is invalid"
        })
    }

    const token = jwt.sign({userId : user._id}, process.env.JWT_SECRET, {expiresIn : "3d"})

    res.cookie("token",token)

    res.status(200).json({
        _id : user._id,
        email : user.email,
        name : user.name
    })
        
}

async function userLogoutController (req,res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        res.status(200),json({
            message : " User logged out successfully"
        })
    }

    await tokenBlacklistModel.create({
        token : token
    })

    res.clearCookie("token")

    res.status(200).json({
        message : " User logged out successfully"
    })
}



module.exports = {userRegisterController, userLoginController, userLogoutController}