import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"; // for secure hash user password

export const signup = async (req, res) =>{
  const {fullName, email, password} = req.body

  try {
   if(!fullName || !email || !password) {
    return res.status(400).json({ message: "All fields are required"});
   } 

   if(password.length < 6) {
    return res.status(400).json({ message: "Password must be atleast 6 characters"});
   }

   // check if email is valid : regex(regular expression)
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
     return res.status(400).json({ message: "Invalid email format" });
   }

   const user = await User.findOne({email});
   if(user) return res.status(400).json({ message: "Email already exist"})

    // 1234 => $dnjas_?qnas
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt)

    const newUser = new User({
        fullName,
        email,
        password: hashedPassword
    });

    if (newUser) {
      // Persist user first, then issue auth cookie
      const savedUser = await newUser.save();
      generateToken(savedUser._id, res);
        

        res.status(201).json({ // something created send res back to client
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            profilePic: newUser.profilePic,
        });
    } else {
        res.status(400).json({ message: "Invalid user data"});
    }
  } catch (error) {
    console.log("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" }); 
  }
  
};