const { Schema, model } = require('mongoose')

const userSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    Password: {type: String, required: true},
    avatar: {type: String},
    Posts: {type: Number, default: 0}
})

module.exports = model('User', userSchema)