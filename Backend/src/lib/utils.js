import jwt from "jsonwebtoken"
import { ENV } from "./env.js";

export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId},ENV.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.cookie("jwt", token, {
        maxAge: 7*24*60*60*1000, // ms(millisecond)
        httpOnly: true, // prevent xss attacks: cross-site scripting
        sameSite: "strict", // CSRF attacks
        secure: ENV.NODE_ENV === "development" ? false : true,
    });

    return token;
};

// http://localhost - not secure
// http://crossmk.com - secure