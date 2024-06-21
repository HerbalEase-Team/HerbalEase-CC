import express from "express";
import { Home, Login, Register, Logout, getUserProfile, updateProfile } from "../controllers/Users.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { refreshToken } from "../controllers/Refreshtoken.js";
import multer from 'multer';
import { getAllHerbs, searchHerbs } from '../controllers/allHerbs.js';
import { getForumDiscussion, createForum, deleteForum } from '../controllers/forum.js';
import { addComment } from '../controllers/komen.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', Home)
router.post('/register', Register);
router.post('/login', Login);
router.get('/profile', verifyToken, getUserProfile);
router.post('/profile', verifyToken, upload.single('file'), updateProfile);
router.get('/search', searchHerbs);
router.get('/allHerbs', getAllHerbs);
router.get('/forum-discussion', getForumDiscussion);
router.post('/forum-discussion', upload.single('photoDiscussionUrl'), createForum);
router.post('/forum-discussion/:id/comment', addComment);
router.delete('/forum-discussion/:id', deleteForum);
router.get('/token', refreshToken);
router.delete('/logout', Logout);

export default router;