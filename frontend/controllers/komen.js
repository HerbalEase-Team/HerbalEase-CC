import { Comment, ForumDiscussion, Users } from "../models/UserModel.js";
import jwt from "jsonwebtoken";

export const addComment = async (req, res, next) => {
  try {
      const token = req.cookies.refreshToken;
      if (!token) {
          return res.status(401).json({ error: "Unauthorized" });
      }

      const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      const userId = decodedToken.userId;

      const { id: forumDiscussionId } = req.params;
      const { comment } = req.body;

      const forumDiscussion = await ForumDiscussion.findByPk(forumDiscussionId, {
          include: [
              {
                  model: Comment,
                  as: 'comments', 
                  attributes: ['id', 'comment'],
                  include: [
                      {
                          model: Users,
                          as: 'user', 
                          attributes: ['id', 'name'],
                      },
                  ],
              },
          ],
      });

      if (!forumDiscussion) {
          return res.status(404).json({ error: "Forum discussion not found" });
      }

      const user = await Users.findByPk(userId);
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }

      const newComment = await Comment.create({
          forumDiscussionId,
          userId,
          name: user.name,
          comment,
      });

      res.status(201).json({ comment: newComment, comments: forumDiscussion.comments });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
  }
};