const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema ({
    username: {type:String,
    unique:true},
    Number:String,
    password:String,
    img:String,
    admin:Boolean,

});
const User = mongoose.model("User",userSchema);

module.exports = User;