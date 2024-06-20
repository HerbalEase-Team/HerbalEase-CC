import { Users, ForumDiscussion, Comment } from "../models/UserModel.js";
import { Storage } from "@google-cloud/storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const storage = new Storage();
const bucketName = "herbalease-image";
const bucket = storage.bucket(bucketName);

const defaultProfilePictureUrl =
  "https://storage.googleapis.com/herbalease-image/Foto-Profil/blank-profile-picture-973460_1280.png";

export const Home = async (req, res) =>{
  try {
    res.status(200).send("Response Berhasil!");
  } catch (error) {
    res.status(500).send("An error occurred");
  }
}

export const Register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!email.includes("@gmail.com")) {
    return res.status(400).json({ msg: "invalid Email" });
  }

  try {
    const existingUser = await Users.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(400).json({ msg: "Email Sudah Terdaftar!" });
    }

    const existingname = await Users.findOne({ where: { name: name } });
    if (existingname) {
      return res.status(400).json({ msg: "Username Sudah Digunakan!" });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    await Users.create({
      name: name,
      email: email,
      password: hashedPassword,
    });

    res.json({ error: false, message: "User Created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

export const Login = async (req, res) => {
  try {
    const user = await Users.findAll({
      where: {
        email: req.body.email,
      },
    });

    if (user.length === 0)
      return res.status(404).json({ msg: "Email not found" });

    const match = await bcrypt.compare(req.body.password, user[0].password);
    if (!match) return res.status(400).json({ msg: "Wrong Password" });

    const userId = user[0].id;
    const name = user[0].name;
    const email = user[0].email;

    const accessToken = jwt.sign(
      { userId, name, email },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const refreshToken = jwt.sign(
      { userId, name, email },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );

    await Users.update(
      {
        refresh_token: refreshToken,
        profile_picture_url:
          user[0].profile_picture_url || defaultProfilePictureUrl,
      },
      {
        where: {
          id: userId,
        },
      }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      error: false,
      message: "success",
      loginResult: {
        userId: userId,
        name: name,
        email: email,
        token: accessToken,
        profile_picture_url:
          user[0].profile_picture_url || defaultProfilePictureUrl,
      },
    });
  } catch (error) {
    res.status(404).json({ msg: "Email not found" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: { name: req.user.name },
      attributes: ["id", "name", "email", "profile_picture_url"],
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updates = {};
    const { name, email } = req.body;

    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;

    const user = await Users.findOne({ where: { email: req.user.email } });

    if (!user) {
      await connection.end();
      return res.status(404).json({ error: "User not found" });
    }

    if (req.file) {
      const fileName = `${user.id}_${Date.now()}_${req.file.originalname}`;
      const filePath = `Foto-Profil/Users/${fileName}`;
      const blob = bucket.file(filePath);

      const [exists] = await blob.exists();
      let publicUrl;

      if (!exists) {
        const blobStream = blob.createWriteStream({
          resumable: false,
          contentType: req.file.mimetype,
        });

        blobStream.on("error", (err) => {
          console.log(err);
          return res
            .status(500)
            .json({ error: "Failed to upload profile picture" });
        });

        blobStream.on("finish", async () => {
          publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
          updates.profile_picture_url = publicUrl;

          await user.update(updates);

          res.json({
            message: "Profile updated successfully",
            profile_picture_url: publicUrl,
          });
        });

        blobStream.end(req.file.buffer);
      } else {
        // Jika file sudah ada, gunakan URL yang sudah ada
        publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
        updates.profile_picture_url = publicUrl;

        await user.update(updates);

        res.json({
          message: "Profile updated successfully",
          profile_picture_url: publicUrl,
        });
      }
    } else {
      if (Object.keys(updates).length > 0) {
        await user.update(updates);
      }

      res.json({ message: "Profile updated successfully" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const Logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204);
  const user = await Users.findAll({
    where: {
      refresh_token: refreshToken,
    },
  });
  if (!user[0]) return res.sendStatus(204);
  const userId = user[0].id;
  await Users.update(
    { refresh_token: null },
    {
      where: {
        id: userId,
      },
    }
  );
  res.clearCookie("refreshToken");
  return res.sendStatus(200);
};
