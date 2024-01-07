const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const mongoose = require("mongoose");
const Users = require("./models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Conversation = require("./models/Conversations");
const Messages = require("./models/Messages");
const cors = require("cors");
const http = require('http').createServer(app);
const io = require("socket.io")(http,{
  cors:{
    origin:"https://engage-chat.vercel.app",
    methods: ["GET", "POST"],
    transports: ['polling'],
    credentials:true
  },
  allowEI03:true
});
const user = Users.find()

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Database Connected Successfully!!"))
  .catch((err) => console.log(err));

const port = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: 'https://engage-chat.vercel.app',
    credentials: true, // You might also need to enable credentials
  })
);

let users = [];
io.on("connection", (socket) => {
  // console.log("User Connected", socket.id);
  socket.on("addUser", (userId) => {
    const isUserExist = users.find((user) => user.userId === userId);
    if (!isUserExist) {
      const user = { userId, socketId: socket.id };
      users.push(user);
      io.emit("getUsers", users);
    }
  });

  socket.on(
    "sendMessage",
    async ({ senderId, receiverId, message, conversationId }) => {
      const receiver = users.find((user) => user.userId === receiverId);
      const sender = users.find((user) => user.userId === senderId);
      const user = await Users.findById(senderId);
      console.log("sender :>> ", sender,receiver);
      if (receiver) {
        io.to(receiver.socketId)
          .to(sender.socketId)
          .emit("getMessage", {
            senderId,
            message,
            conversationId,
            receiverId,
            user: { id: user._id, fullName: user.fullName, email: user.email },
          });
      } else{
        io.to(sender.socketId)
          .emit("getMessage", {
            senderId,
            message,
            conversationId,
            receiverId,
            user: { id: user._id, fullName: user.fullName, email: user.email },
          });
      }
    }
  );

  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });
});

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.post("/api/register", async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if ((!fullName, !email, !password)) {
      res.status(400).send("Please fill all required fields");
    } else {
      const existUser = await Users.findOne({ email });
      if (existUser) {
        res.status(400).send("User Already Exists");
      } else {
        const newUser = new Users({ fullName, email });
        bcrypt.hash(password, 10, async (err, hashedPassword) => {
          newUser.set("password", hashedPassword);
          newUser.save();
          next();
        });
        return res.status(200).send({message:"User Registered Successfully"});
      }
    }
  } catch (err) {
    return res.status(500).send(err);
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).send("Please fill all required fields");
    } else {
      const user = await Users.findOne({ email });
      if (!user) {
        res.status(400).send("User email or password is incorrect");
      } else {
        const validateUser = await bcrypt.compare(password, user.password);
        if (!validateUser) {
          res.status(400).send("User email or password is incorrect");
        } else {
          const payload = {
            userId: user.id,
            email: user.email,
          };
          const secret = process.env.SECRET_KEY || "Surya";
          jwt.sign(
            payload,
            secret,
            { expiresIn: 84600 },
            async (err, token) => {
              await Users.updateOne(
                { _id: user._id },
                {
                  $set: { token },
                }
              );
              user.save();
              return res.status(200).send({
                user: {
                  id: user._id,
                  email: user.email,
                  fullName: user.fullName,
                },
                token: token,
              });
            }
          );
        }
      }
    }
  } catch (err) {
    console.log(err, "Error");
  }
});

app.post("/api/conversation", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const newConversation = new Conversation({
      members: [senderId, receiverId],
    });
    await newConversation.save();
    res.status(200).send("Conversation Created Successfully!!");
  } catch (err) {
    console.log(err, "Error");
  }
});

// app.get("/api/conversation/:userId", async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     const conversations = await Conversation.find({
//       members: { $in: [userId] },
//     });
//     const conversationUserData = Promise.all(
//       conversations.map(async (conversation) => {
//         const receiverId = await conversation.members.find(
//           (member) => member !== userId
//         );
//         const user = await Users.findById(receiverId);
//         return {
//           user: {
//             receiverId: user._id,
//             email: user.email,
//             fullName: user.fullName,
//           },
//           conversationId: conversation._id,
//         };
//       })
//     );
//     res.status(200).json(await conversationUserData);
//   } catch (err) {
//     console.log(err);
//   }
// });

app.get("/api/conversation/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const conversations = await Conversation.find({
      members: { $in: [userId] },
    });

    const conversationUserData = Promise.all(
      conversations.map(async (conversation) => {
        const receiverId = conversation.members.find(
          (member) => member !== userId && member !== ""
        );

        if (!receiverId) {
          // Handle the case where receiverId is empty or not found
          return null; // Or handle appropriately based on your logic
        }

        try {
          const user = await Users.findById(receiverId);
          return {
            user: {
              receiverId: user._id,
              email: user.email,
              fullName: user.fullName,
            },
            conversationId: conversation._id,
          };
        } catch (error) {
          // Handle any errors that occur during user retrieval
          console.error("Error fetching user:", error);
          return null; // Or handle appropriately based on your logic
        }
      })
    );

    // Filter out null values before sending response
    const validConversationUserData = (await conversationUserData).filter(
      Boolean
    );

    res.status(200).json(validConversationUserData);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// app.post("/api/message", async (req, res) => {
//   try {
//     const { conversationId, senderId, message, receiverId = "" } = req.body;
//     if (!senderId || !message)
//       return res.status(400).send("Please fill all required fields");
//     if (conversationId === "new" && receiverId) {
//       const newConversation = new Conversation({
//         members: [senderId, receiverId],
//       });
//       await newConversation.save();
//       const newMessage = new Messages({
//         conversationId: newConversation._id,
//         senderId,
//         message,
//       });
//       await newMessage.save();
//       return res.status(200).send("Message sent Successfully");
//     } else if (!conversationId && !receiverId) {
//       return res.status(400).send("Please fill all required fields");
//     } else {
//       const newMessage = new Messages({ conversationId, senderId, message });
//       await newMessage.save();
//       res.status(200).send("Message sent successfully");
//     }
//   } catch (err) {
//     console.log(err);
//   }
// });

app.post('/api/message', async (req, res) => {
  try {
    const { conversationId, senderId, message, receiverId = '' } = req.body;

    if (!senderId || !message) {
      return res.status(400).send('Please fill all required fields');
    }

    if (conversationId === 'new') {
      if (!receiverId) {
        return res.status(400).send('Please provide a receiverId for the new conversation');
      }

      // Check if a conversation exists between these users
      const existingConversation = await Conversation.findOne({
        members: { $all: [senderId, receiverId] },
      });

      if (existingConversation) {
        // If a conversation already exists, use its ID
        const newMessage = new Messages({ conversationId: existingConversation._id, senderId, message });
        await newMessage.save();
        return res.status(200).send('Message sent successfully');
      }

      // If no conversation exists, create a new one
      const newConversation = new Conversation({ members: [senderId, receiverId] });
      await newConversation.save();
      const newMessage = new Messages({ conversationId: newConversation._id, senderId, message });
      await newMessage.save();
      return res.status(200).send('Message sent successfully');
    } else if (!conversationId) {
      return res.status(400).send('Please provide a valid conversationId');
    }

    const newMessage = new Messages({ conversationId, senderId, message });
    await newMessage.save();
    return res.status(200).send('Message sent successfully');
  } catch (error) {
    console.log(error, 'Error');
    return res.status(500).send('Internal server error');
  }
});


app.get("/api/message/:conversationId", async (req, res) => {
  try {
    const checkMessages = async (conversationId) => {
      const messages = await Messages.find({ conversationId });
      const messageUserData = Promise.all(
        messages.map(async (message) => {
          const user = await Users.findById(message.senderId);
          return {
            user: { id: user._id, email: user.email, fullName: user.fullName },
            message: message.message,
          };
        })
      );
      res.status(200).json(await messageUserData);
    };
    const conversationId = req.params.conversationId;
    if (conversationId === "new") {
      const checkConversation = await Conversation.find({
        members: { $all: [req.query.senderId, req.query.receiverId] },
      });
      if (checkConversation.length > 0) {
        checkMessages(checkConversation[0]._id);
      } else {
        return res.status(200).json([]);
      }
    } else {
      checkMessages(conversationId);
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const users = await Users.find({ _id: { $ne:  userId} });
    // console.log("Users:>> ", users)
    const usersData = Promise.all(
      users.map(async (user) => {
        return {
          user: {
            email: user.email,
            fullName: user.fullName,
            receiverId: user._id,
          },
        };
      })
    );
    res.status(200).json(await usersData);
  } catch (err) {
    console.log(err);
  }
});

// Add this route to your existing backend code
app.post("/api/logout", async (req, res) => {
  try {
    const { userId } = req.body;

    // Clear the token or any other authentication-related data
    await Users.updateOne(
      { _id: userId },
      {
        $set: { token: null },
      }
    );

    res.status(200).send("Logout successful");
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


http.listen(port, () => {
  console.log("App listening on port: " + port);
});
