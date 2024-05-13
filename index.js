import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const startServer = async () => {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({
    origin: ["http://localhost:3000/","https://user_register.onrender.com"],
  }));

  // Connecting to MongoDB
  try {
    await mongoose.connect("mongodb://localhost:27017/UserauthenticationDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }

  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
  });

  // Hash the password before saving
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
      return next();
    }
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      return next(error);
    }
  });

  const User = mongoose.model("User", userSchema);

  // Define Routes
  app.post("/login", async (req, res) => {
    const {email, password } = req.body;
    try {
      const user = await User.findOne({ email: email });
      if (user) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
          res.send({ message: 'Logged in' });
      //     const sessUser = { id: user.id, name: user.name, email: user.email };
      // req.session.user = sessUser;
        } else {
          res.send({ message: 'Password not found' });
        }
      } else {
        res.send({ message: 'User not registered' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  });

  app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        res.status(400).send({ message: "User already registered" });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });
        await newUser.save();
        res.status(200).send({ message: "Successfully Registered" });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  });

  // Start the server
  const PORT = 9002;
  app.listen(PORT, () => {
    console.log(`BE started at port ${PORT}`);
  });
};

// Call the async function to start the server
startServer();

