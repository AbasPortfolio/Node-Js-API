const express = require('express')
const { connect } = require('mongoose')
const cors = require('cors')
require ('dotenv').config()
const uploads = require('express-fileupload')
const UserRoutes = require('./Routes/userRoutes')
const PostsRoutes = require('./Routes/postsRoutes')
const { notFound, errorHandler } = require('./middleware/errorMiddleware')



const app = express();


app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))
app.use(cors({credentials: true, origin: "https://mzansi-reads.vercel.app/"}))
app.use(uploads())
app.use('/uploads', express.static(__dirname + '/uploads'))


app.use('/api/users', UserRoutes)
app.use('/api/posts', PostsRoutes)

app.use(notFound)
app.use(errorHandler)


connect(process.env.MONGO_URL).then(
    app.listen(5000,()=>{
        console.log(`app is listening on port ${process.env.PORT}`)
    })
).catch(error=>{console.log(error)})
