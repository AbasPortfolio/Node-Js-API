const Post = require('../models/posts')
const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')
const httpError = require('../models/errorModel')
const user = require('../models/user')
const { error } = require('console')


//Create post
//POST: /create-post
const createPost = async(req, res, next) =>{
    try {
        let {title, description} = req.body;
    if(!title || !description || !req.files){
        return next(new httpError("Please fill in all fields and choose a thumbnail", 422))
    }
    const {thumbnail} = req.files;
    if(thumbnail > 2000000){
        return next(new httpError("Thumbnail is too big, should be less than 2mb", 422))
    }
    let fileName = thumbnail.name
    let splittedFileName = fileName.split('.')
    let newFileName = splittedFileName[0] + uuid() + splittedFileName[splittedFileName.length - 1]
    thumbnail.mv(path.join(__dirname, '..', '/uploads', newFileName), async(err)=>{
        if(err){
            return next(new httpError(err))
        }else{
            const newPost = await Post.create({title, description, thumbnail: newFileName, creator: req.user.id})
            if(!newPost){
                return new httpError("Post couldn't be created", 422)
            }
            //Find user and increment by 1
            const currentUser = await user.findById(req.user.id)
            const userPostCount = currentUser.Posts + 1;
            await user.findByIdAndUpdate(req.user.id, userPostCount)
            res.status(201).json(newPost)
        }
    })



    } catch (error) {
        return next(new httpError(error))
    }
}

//Get all posts
//GET: /get-posts
const getPosts = async (req, res, next) =>{
    try {
        const postings = await Post.find().sort({updatedAt: -1})
        res.status(200).json(postings)
    } catch (error) {
        return next(new httpError(error))
    }
}

//Get single post
//GET: /post/:id
const getPost = async (req, res, next) =>{
    try {
        const postId = req.params.id;
        const posting = await Post.findById(postId)
        if(!posting){
            return next(new httpError("Post couldn't be found", 404))
        }
        res.status(200).json(posting)
    } catch (error) {
        return next(new httpError(error))
    }
}

//Edit post
//Protected
//PATCH: /post/:id
const editPost = async(req, res, next) =>{
    try {
        let fileName;
        let newFileName;
        let updatedPost; 
        const postId = req.params.id
        let {title, description} = req.body;
        if(!title || !description){
            return next(new httpError("Please fill in all fields"))
        }
        if(!req.files){
            newPost = await Post.findByIdAndUpdate(postId, {title, description}, {new: true})
        }else{
                //get old post from database
                const oldPost = await Post.findById(postId)
                if(req.user.id == oldPost.creator){
                //delete old photo from db
                fs.unlink(path.join(__dirname,"..","uploads", oldPost.thumbnail), async(err)=>{
                    if(err){
                        return next(new httpError(err))
                    }
                })
                 //upload new photo
                const {thumbnail} = req.files;
                if(thumbnail.size > 2000000){
                    return next(new httpError('Thumbnail size is too big, it must be less than 2mb'))
                }
                fileName = thumbnail.name
                const splittedFileName = fileName.split('.')
                newFileName = splittedFileName[0] + uuid() + "." + splittedFileName[splittedFileName.length - 1]
                thumbnail.mv(path.join(__dirname, '..', 'uploads', newFileName), async(err)=>{
                    if(err){
                        return next(new httpError(err))
                    }
                })
                updatedPost = await Post.findByIdAndUpdate(postId, {title, description, thumbnail: newFileName}, {new: true})
            }
           

            if(!updatedPost){
                return next(new httpError("Could not update the error", 403))
            }
            res.status(200).json(updatedPost)

        }
    } catch (error) {
        return next(new httpError(error))
    }
}
//Delete post
//Protected
//DELETE: /post/:id
const deletePost = async(req, res, next) =>{
    try {
        const postId = req.params.id;
        if(!postId){
            return next(new httpError("Post Unavailable", 422))
        }
        const myPost = await Post.findById(postId)
        const fileName = myPost?.thumbnail

        //delete old photo from the database
        if(req.user.id == myPost.creator){
            fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async(err)=>{
                if(err){
                    return next(new httpError(err))
                }else{
                    await Post.findByIdAndDelete(postId)
                    //find the current logged in user
                    const currentUser = await user.findById(req.user.id)
                    const userPostCount = currentUser?.Posts - 1;
                    await user.findByIdAndUpdate(req.user.id, {Posts: userPostCount})
                    res.status(200).json(`Post ${postId} deleted successfully`)
                }
            })
        }

    } catch (error) {
        return next(new httpError(error))
    }
}

module.exports = {createPost, getPosts, getPost, editPost, deletePost}