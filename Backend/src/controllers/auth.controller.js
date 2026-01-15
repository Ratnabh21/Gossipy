import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"; // for secure hash user password
import { ENV } from "../lib/env.js";


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

        //todo : send a welcome email to user
        try {
          console.log("CLIENT_URL at signup:", ENV.CLIENT_URL);
          await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);
        } catch (error) {
          console.error("failed to send welcome email:", error)
        }

    } else {
        res.status(400).json({ message: "Invalid user data"});
    }
  } catch (error) {
    console.log("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" }); 
  }
  
};

export const login = async (req, res) => {
  const { email, password } = req.body;

    if(!email || !password) {
      return res.status(400).json({message: "Email and password are required"});
    };
    
  try {
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({message: "Invalid credentials"});
    // never tell the client which one is incorrect password or email
    
    const isPasswordCorrect = await bcrypt.compare(password,user.password)
    if (!isPasswordCorrect)  return res.status(400).json({message: "Invalid credentials"});

    generateToken(user._id,res)
    
     res.status(200).json({ // created successfully
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
  } catch (error) {
    console.error("Error in login controllers:", error);
    res.status(500).json({message: "Internal server error" });
  }   
};

export const logout = (_, res) => {
  res.cookie("jwt","", { maxAge: 0 });
  res.status(200).json({message: "logged out successfully" });
};

export const updateProfile = async (req, res) => {
   try {
    const {profilePic} = req.body;
    if(!profilePic) return res.status(400).json({message: "Profile pic is required" });

    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: ture } //return the updated user
    );
     
    res.status(200).json(updatedUser);
   } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
   }
};