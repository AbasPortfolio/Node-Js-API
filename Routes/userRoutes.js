const {Router} = require('express')
const { GetUser, RegisterUser, LoginUser, ChangeAvatar, EditUser } = require('../controllers/userController')
const authMiddleware = require('../middleware/authMiddleware')

const router = Router()

router.post('/register', RegisterUser)
router.post('/login', LoginUser)
router.get('/:id', GetUser)
router.post('/change-avatar', authMiddleware, ChangeAvatar)
router.patch('/edit-user', authMiddleware, EditUser)

module.exports = router