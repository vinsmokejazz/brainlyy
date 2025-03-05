import { NextFunction, Request, Response } from "express"
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_USER_PASSWORD } from "./config";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers["authorization"];
  //@ts-ignore
  const decoded = jwt.verify(header as string, JWT_USER_PASSWORD);
  if (decoded) {
    if (typeof decoded === "string") {
      res.status(403).json("you are not logged in");
      return;
    }
    //@ts-ignore
    req.userId = (decoded as JwtPayload).id;
    next();
  } else {
    res.status(403).json("you are not logged in")
  }

}