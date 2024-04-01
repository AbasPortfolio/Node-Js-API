const {Router} = require("express")
const {createPost, getPosts, getPost, editPost, deletePost} = require('../controllers/postsController')
const authMiddleware = require('../middleware/authMiddleware') 



const router = Router()

router.post('/', authMiddleware, createPost)
router.get('/', getPosts)
router.get('/:id', getPost)
router.patch('/:id',authMiddleware, editPost)
router.delete('/:id',authMiddleware, deletePost)

module.exports = router