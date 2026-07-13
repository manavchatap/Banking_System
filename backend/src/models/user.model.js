const mongoose = require ("mongoose");
const bcrypt = require ("bcryptjs")

const userSchema = new mongoose.Schema ({

    email : {
        type : String,
        required : [true, "Email is required for creating a account"],
        trim : true,
        lowercase : true,
        match : [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/],  //  /email regex/
        unique : [true, "Email already exists"]
    },
    name : {
        type : String,
        required : [true, "Name is required for creating a account"]
    },
    password : {
        type : String,
        required : [true, "Password is required for creating a account"],
        minlength : [6,"Password should contain more than 6 characters"],
        select : false   // do not fetched by default with user until called
    },
    systemUser : {
        type : Boolean,
        default : false,
        immutable : true,  // system user cannot be modified or deleted
        select : false  // do not fetched by default with user until called
    }
},
{
    timestamps : true  // when user is created or deleted
})

userSchema.pre("save",async function (){   // user saved after password hashed  , next() cannot be used with async function
    if(!this.isModified("password"))
        return;

    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash
    return;
})

userSchema.methods.comparePassword = async function (password) {
    
    return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("user",userSchema)

module.exports = userModel;