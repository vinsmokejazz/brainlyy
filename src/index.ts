import express from "express";
import jwt from "jsonwebtoken";
import { ContentModel, LinkModel, UserModel } from "./db";
import bcrypt from "bcrypt";
import { JWT_USER_PASSWORD } from "./config";
import { userMiddleware } from "./middleware";
import { random } from "./utils";


const app = express();
app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await UserModel.create({ username: username, password: hashedPassword });
    res.status(201).json("signed up successfully");
  } catch (error) {
    res.status(400).json("user already exists")
  }
});


app.post("/api/v1/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await UserModel.findOne({ username });
  if (!user) {
    res.status(403).json("incorrect creds");
  }
  //@ts-ignore
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (passwordMatch) {
    //@ts-ignore
    const token = jwt.sign({ id: user._id.toString() }, JWT_USER_PASSWORD);
    res.status(200).json({
      token: token,
    })
  } else {
    res.status(403).json("incorrect creds");
  }
})

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const link = req.body.link;
  const type = req.body.type;
  await ContentModel.create({
    link,
    type,
    //@ts-ignore
    userId: req.userId,
    tags: []

  })

})

app.get("/api/v1/content", userMiddleware, async (req, res) => {
  //@ts-ignore
  const userId = req.userId;
  const content = await ContentModel.find({
    userId: userId
  }).populate("userId", "username")
  res.json({
    content
  })

})

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  const contentId = req.body.contentId;
  await ContentModel.deleteMany({
    contentId,
    //@ts-ignore
    userId: req.userId
  })
  res.json("Deleted")


})

app.post("/api/v1/brain/:share", userMiddleware, async (req, res) => {
  const share = req.body.share;
  if (share) {
    const existingLink = await LinkModel.findOne({
      //@ts-ignore
      userId: req.userId
    });
    if (existingLink) {
      res.json({
        hash: existingLink.hash
      })
      return;
    }
    const hash = random(10);
    await LinkModel.create({
      hash: hash
    })
  } else {
    await LinkModel.deleteOne({
      //@ts-ignore
      userId: req.userId
    });
    res.json("removed link");
  }
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
  const hash = req.params.shareLink;
  const link = await LinkModel.findOne({
    hash
  });

  if (!link) {
    res.status(411).json(" sorry incorrect input");
    return;
  }
  const content = await ContentModel.find({
    userId: link.userId
  })
  const user = await UserModel.findOne({
    _id: link.userId
  })

  if (!user) {
    res.status(411).json("user not found");
    return;
  }
  res.json({
    username: user.username,
    content: content
  })
})


app.listen(3000);

