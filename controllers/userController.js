const httpError = require("../models/errorModel");
const user = require("../models/user");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const fs = require('fs');
const { v4: uuid } = require('uuid')
const path = require("path");
require('dotenv').config()

//POST : api/users/register
// Uprotected



const RegisterUser = async (req,res,next)=>{
    try {
        const {name, email, password, password2} = req.body;
        if(!name || !email || !password){
            return next(new httpError("Please fill in all fields", 422))
        }
        const newMail = email.toLowerCase()
        const emailExists = await user.findOne({Email: newMail})
        if(emailExists){
            return next(new httpError("Email already exists", 422))
        }
        if((password.trim()).length < 6){
            return next(new httpError("Password must be atleast 6 characters long",422))
        }
        if(password != password2){
            return next(new httpError("passwords do not match", 422))
        }

        const hash = await bcrypt.genSalt(10)
        const hashPass = await bcrypt.hashSync(password, hash);

        const newUser = await user.create({name, email: newMail, Password: hashPass})
        res.status(200).json(`new user ${newUser.email} registered`)

    } catch (error) {
        return next(new httpError('User registration failed', 422))
    }
}










//POST : api/users/login
//Unprotected

const LoginUser = async(req,res,next)=>{
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return next(new httpError("Please fill in all fields"))
        }
        const newEmail = email.toLowerCase()
        const myUser = await user.findOne({email: newEmail})
        if(!myUser){
            return next(new httpError("Invalid credentials", 422))
        }
        const comparePass = await bcrypt.compare(password, myUser.Password)
        if(!comparePass){
            return next(new httpError("Invalid credentials", 422))
        }
        const {_id: id, name} = myUser
        const token = jwt.sign({id, name}, process.env.JWT_SECRET_KEY,{expiresIn: '1d'})
        res.status(200).json({token, id, name})
    } catch (error) {
        return next(new httpError("Oops login failed. Check your credentials", 422))
    }
}

//GET : api/users/:id
const GetUser = async (req,res,next) =>{
    try {
        const {id} = req.params;
        const myUser = await user.findById(id).select('-password')
        if(!myUser){
            return next(new httpError('User not found', 404))
        }
        res.status(200).json(myUser)
    } catch (error) {
        return next(new httpError("Oops login failed. Check your credentials", 422))
    }
}

//POST : api/users/change-avatart
// Protected route

const ChangeAvatar = async(req, res, next) =>{
    try {
        if(!req.files.avatar){
            return next(new httpError('Please choose an image', 422))
        }
        //find the user from the database
        const myUser = await user.findById(req.user.id)
        // delete old avatar if exists
        if(myUser.avatar){
            fs.unlink(path.join(__dirname, '..', 'uploads', myUser.avatar), (err)=>{
                if(err){
                    return next(new httpError(err))
                }
            })
        }
        const {avatar} = req.files;
        // check the file size
        if(avatar.size > 500000){
            return next(new httpError("Profile picture too big. Should be less than 500kb", 422))
        }
        let fileName = avatar.name
        let splittedFileName = fileName.split('.')
        let newFileName = splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length - 1]
        avatar.mv(path.join(__dirname, '..', 'uploads', newFileName), async(err)=>{
            if(err){
                return next(new httpError(err))
            }
            const updateAvatar = await user.findByIdAndUpdate(req.user.id, {avatar: newFileName}, {new: true})
            if(!updateAvatar){
                return next(new httpError("avatar couldn't be changed", 422))
            }
            res.status(200).json(updateAvatar)
        })
    } catch (error) {
        return next(new httpError("Opps something went wrong.", 422))
    }
}
//PATCH : api/users/edit-user
//Protected
const EditUser = async(req,res,next) =>{
    try {
        const {name, email, currentPassword, newPassword, confirmNewPassword} = req.body;

        if(!name || !email || !currentPassword || !newPassword || !confirmNewPassword){
            return next(new httpError("Please fill in all fields", 422))
        }
        //get the user from the database
        const myUser = await user.findById(req.user.id)
        if(!myUser){
            return next(new httpError('User not found',403))
        }
        //compare current password to db
        const validateUserPassword = await bcrypt.compare(currentPassword, myUser.Password)
        if(!validateUserPassword){
            return next(new httpError('invalid current password', 422))
        }
        //compare the new passwords
        if(newPassword !== confirmNewPassword){
            return next(new httpError("New passwords do not match", 422))
        }
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(newPassword, salt)
        
        // update the user
        const newInfo = await user.findByIdAndUpdate(req.user.id, {name, email, Password: hashPassword}, {new: true})
        res.status(200).json(newInfo)
    } catch (error) {
        return next(new httpError(error))
    }
}

module.exports = {RegisterUser, LoginUser, ChangeAvatar, EditUser, GetUser}