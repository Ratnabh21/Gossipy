import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUser = await User.find({_id: { $ne: loggedInUserId } }).select("-password")

        res.status(200).json(filteredUser);
    } catch (error) {
        console.log("Error in getAllContacts:", error);
        res.status(500).json({Message: "Server error"});
    }
} 

export const getMessagesByUserId = async (req, res) => { 
    try {
        const myId = req.user._id;
        const {id: userToChatId } = req.params;
        
        // me and you
        // i send u the msg
        // u send me the msg

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        });

        res.status(200).json(messages);
    } catch (error) {
       console.log("Error in getMassages controller:", error.message);
       res.status(500).json({Message: "Internal server error"}); 
    }
}

export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
         // upload base64 image to cloudinary
          const uploadResponse = await cloudinary.uploader.upload(image);
          imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message ({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        //todo: send messages in real-time if user is online - socket.io 

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller:", error.message);
        res.status(500).json({messages: "Internal server error"});
    }
}

export const getChatPartners = async (req, res) => {
    try {
         const loggedInUserId = req.user._id;

    // find all the messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    res.status(200).json(chatPartners);
    } catch (error) {
      console.error("Error in getChatPartners controller:", error.message);
      res.status(500).json({error: "Internal server error"});  
    }
};