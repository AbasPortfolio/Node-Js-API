
const httpError = require('../models/errorModel')
const jwt = require('jsonwebtoken')

const authMiddleware = async(req, res, next)=>{
    const Authorization = req.headers.Authorization || req.headers.authorization;
    if(Authorization && Authorization.startsWith("Bearer")){
        const token = Authorization.split(' ')[1]

        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, info)=>{
            if(err){
                return next(new httpError("Unouthorized, Invalid token", 403))
            }
            req.user = info;
            next()
        })
    }else{
        return next(new httpError("Invalid token", 422))
    }
}

module.exports = authMiddleware