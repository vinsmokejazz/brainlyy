import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ContentModel, LinkModel, UserModel } from "./db";
import bcrypt from "bcrypt";
import { JWT_USER_PASSWORD } from "./config";
import { userMiddleware } from "./middleware";
import { random } from "./utils";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

const app = express();
app.use(express.json());

// Signup Route
app.post("/api/v1/signup", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await UserModel.create({ username, password: hashedPassword });
    res.status(201).json("Signed up successfully");
  } catch (error) {
    res.status(409).json("User already exists");
  }
});

// Signin Route
//@ts-ignore
app.post("/api/v1/signin", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user:any = await UserModel.findOne({ username });

  if (!user) {
    return res.status(403).json("Incorrect credentials");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(403).json("Incorrect credentials");
  }

  const token = jwt.sign(
    { id: user._id.toString() },
    JWT_USER_PASSWORD as string
  );
  res.json({ token });
});

// Content Routes
app.post("/api/v1/content", userMiddleware, async (req: Request, res: Response) => {
  const { link, type } = req.body;
  try {
    const content = await ContentModel.create({
      link,
      type,
      userId: req.userId,
      tags: []
    });
    res.status(201).json(content);
  } catch (error) {
    res.status(500).json("Error creating content");
  }
});

app.get("/api/v1/content", userMiddleware, async (req: Request, res: Response) => {
  try {
    const content = await ContentModel.find({ userId: req.userId })
      .populate("userId", "username");
    res.json({ content });
  } catch (error) {
    res.status(500).json("Error fetching content");
  }
});

app.delete("/api/v1/content", userMiddleware, async (req: Request, res: Response) => {
  const { contentId } = req.body;
  try {
    await ContentModel.deleteOne({ _id: contentId, userId: req.userId });
    res.json("Content deleted successfully");
  } catch (error) {
    res.status(500).json("Error deleting content");
  }
});

// Sharing Routes 
//@ts-ignore
app.post("/api/v1/brain/:share", userMiddleware, async (req: Request, res: Response) => {
  const share = req.params.share === "true";
  
  if (share) {
    try {
      const existingLink = await LinkModel.findOne({ userId: req.userId });
      if (existingLink) {
        return res.json({ hash: existingLink.hash });
      }

      const hash = random(10);
      await LinkModel.create({ hash, userId: req.userId });
      res.json({ hash });
    } catch (error) {
      res.status(500).json("Error creating share link");
    }
  } else {
    try {
      await LinkModel.deleteOne({ userId: req.userId });
      res.json("Share link removed");
    } catch (error) {
      res.status(500).json("Error removing share link");
    }
  }
});

//@ts-ignore
app.get("/api/v1/brain/:shareLink", async (req: Request, res: Response) => {
  const { shareLink } = req.params;
  try {
    const link = await LinkModel.findOne({ hash: shareLink });
    if (!link || !link.userId) {
      return res.status(404).json("Invalid share link");
    }

    const [content, user] = await Promise.all([
      ContentModel.find({ userId: link.userId }),
      UserModel.findById(link.userId)
    ]);

    if (!user) {
      return res.status(404).json("User not found");
    }

    res.json({
      username: user.username,
      content
    });
  } catch (error) {
    res.status(500).json("Error retrieving shared content");
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});