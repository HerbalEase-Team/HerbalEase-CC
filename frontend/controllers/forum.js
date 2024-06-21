import { ForumDiscussion, Users, Comment } from '../models/UserModel.js';
import { Storage } from '@google-cloud/storage';
import jwt from 'jsonwebtoken';
const storage = new Storage();
const bucketName = 'herbalease-image';

export const createForum = async (req, res) => {
  const { userId } = req.query;
  const { title, description, keyword } = req.body;
  const photoDiscussionFile = req.file;

  try {
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await Users.findByPk(userId);
    if (!user) {
      console.error('User not found with id:', userId);
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
        console.error('Blob stream error:', err);
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
            console.error('Forum discussion already exists with title:', title);
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

          console.log('New forum discussion created:', newForum.id);
          res.status(201).json(newForum);
        } catch (error) {
          console.error('Error saving forum discussion:', error);
          res.status(500).json({ error: 'Failed to create forum discussion' });
        }
      });

      blobStream.end(photoDiscussionFile.buffer);
    } else {
      try {
        const existingForum = await ForumDiscussion.findOne({
          where: {
            title,
            description,
            keyword,
          },
        });

        if (existingForum) {
          console.error('Forum discussion already exists with title:', title);
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

        console.log('New forum discussion created without photo:', newForum.id);
        res.status(201).json(newForum);
      } catch (error) {
        console.error('Error saving forum discussion:', error);
        res.status(500).json({ error: 'Failed to create forum discussion' });
      }
    }
  } catch (error) {
    console.error('Internal server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getForumDiscussion = async (req, res) => {
  try {
      const discussions = await ForumDiscussion.findAll({
          include: [
              {
                  model: Users,
                  as: 'user', 
                  attributes: ['id', 'name', 'email', 'profile_picture_url']
              },
              {
                  model: Comment,
                  as: 'comments',
                  include: [
                      {
                          model: Users,
                          as: 'user', 
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