import { ForumDiscussion, Users, Comment } from '../models/UserModel.js';
import { Storage } from '@google-cloud/storage';
import jwt from 'jsonwebtoken';
const storage = new Storage();
const bucketName = 'herbalease-image';

export const createForum = async (req, res) => {
  const { title, description, keyword } = req.body;
  const photoDiscussionFile = req.file;
  const token = req.cookies.refreshToken; 
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const id = decodedToken.userId;

  try {
    const user = await Users.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let photoDiscussionUrl = null;
    let profilePictureUrl = user.profile_picture_url;

    if (photoDiscussionFile) {
      const fileName = `${user.name}_${photoDiscussionFile.originalname}`;
      const filePath = `forum/${fileName}`;
      const blob = storage.bucket(bucketName).file(filePath);

      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: photoDiscussionFile.mimetype,
      });

      blobStream.on('error', (err) => {
        console.error(err);
        return res.status(500).json({ error: 'Failed to upload discussion photo' });
      });

      blobStream.on('finish', async () => {
        photoDiscussionUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

        try {
          const existingForum = await ForumDiscussion.findOne({
            where: {
              title,
              description,
              keyword,
            },
          });

          if (existingForum) {
            return res.status(409).json({ error: 'Forum discussion already exists' });
          }

          const newForum = await ForumDiscussion.create({
            userId: user.id,
            name: user.name,
            title,
            description,
            keyword,
            photoDiscussionUrl,
            profilePictureUrl: profilePictureUrl,
          });

          res.status(201).json(newForum);
        } catch (error) {
          console.error('Error saving forum discussion:', error);
          res.status(500).json({ error: 'Failed to create forum discussion' });
        }
      });

      blobStream.end(photoDiscussionFile.buffer);
    } else {
      const existingForum = await ForumDiscussion.findOne({
        where: {
          title,
          description,
          keyword,
        },
      });

      if (existingForum) {
        return res.status(409).json({ error: 'Forum discussion already exists' });
      }

      const newForum = await ForumDiscussion.create({
        userId: user.id,
        name: user.name,
        title,
        description,
        keyword,
        photoDiscussionUrl,
        profilePictureUrl: profilePictureUrl, 
      });

      res.status(201).json(newForum);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getForumDiscussion = async (req, res) => {
  try {
      const discussions = await ForumDiscussion.findAll({
          include: [
              {
                  model: Users,
                  as: 'user', // gunakan alias yang didefinisikan dalam asosiasi
                  attributes: ['id', 'name', 'email', 'profile_picture_url']
              },
              {
                  model: Comment,
                  as: 'comments', // gunakan alias yang didefinisikan dalam asosiasi
                  include: [
                      {
                          model: Users,
                          as: 'user', // gunakan alias yang didefinisikan dalam asosiasi
                          attributes: ['id', 'name', 'email', 'profile_picture_url']
                      }
                  ]
              }
          ]
      });
      res.json(discussions);
  } catch (error) {
      console.log(error);
      res.status(500).json({ msg: 'Internal server error' });
  }
};



export const deleteForum = async (req, res) => {
    try {
      const { id } = req.params;
      const forumDiscussion = await ForumDiscussion.findByPk(id);
  
      if (!forumDiscussion) {
        return res.status(404).json({ error: 'Forum discussion not found' });
      }
  
      await Comment.destroy({
        where: {
          forumDiscussionId: id,
        },
      });
  
      await forumDiscussion.destroy();
  
      res.status(200).json({ message: 'Forum berhasil dihapus' });
      res.status(204).end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };