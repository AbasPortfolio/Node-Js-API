const { Schema, model, } = require('mongoose')

const postSchema = new Schema({
    title: {type: String, required: true},
    thumbnail:{type: String, required: true},
    description: {type: String, required: true},
    creator: {type: Schema.Types.ObjectId, ref:"user"},
}, {timestamps: true})

module.exports = model("Post", postSchema)