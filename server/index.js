// server/index.js
require("dotenv").config();
console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// --- MODELS ---

// User Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "staff", "admin"],
    default: "student",
  },
});
const User = mongoose.model("User", userSchema);

// Item Model (Lost & Found)
const itemSchema = new mongoose.Schema({
  type: { type: String, enum: ["lost", "found"], required: true },
  name: String,
  category: String,
  color: String,
  date: String,
  location: String,
  description: String,
  imageUrl: String,
  status: { type: String, default: "open" }, // open, matched, returned
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});
// Index for search
itemSchema.index({
  name: "text",
  description: "text",
  category: "text",
  color: "text",
});
const Item = mongoose.model("Item", itemSchema);

// Pickup Request Model
const pickupSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "pending" }, // pending, accepted, completed
  meetingSpot: String,
  meetingTime: String,
});
const Pickup = mongoose.model("Pickup", pickupSchema);

// --- MIDDLEWARE ---
const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token)
    return res.status(401).json({ msg: "No token, authorization denied" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: "Token is not valid" });
  }
};

// --- ROUTES ---

// 1. Auth Routes
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: 3600 }
    );
    res.json({ token, user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: 3600 }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email, role: user.role },
    });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// 2. Item Routes
app.post("/api/items", auth, async (req, res) => {
  try {
    const newItem = new Item({ ...req.body, postedBy: req.user.id });
    const item = await newItem.save();
    res.json(item);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ date: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Smart Matching Route
app.get("/api/items/match/:id", auth, async (req, res) => {
  try {
    const currentItem = await Item.findById(req.params.id);
    if (!currentItem) return res.status(404).json({ msg: "Item not found" });

    // Logic: Find items of OPPOSITE type (Lost vs Found) that match category OR color OR location
    const matches = await Item.find({
      type: currentItem.type === "lost" ? "found" : "lost",
      $or: [
        { category: currentItem.category },
        { color: currentItem.color },
        { location: currentItem.location },
        { $text: { $search: currentItem.name } }, // Text search on name
      ],
      status: "open",
    });
    res.json(matches);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

// 3. Pickup Routes
app.post("/api/pickup", auth, async (req, res) => {
  try {
    const { itemId, ownerId, meetingSpot, meetingTime } = req.body;
    const newPickup = new Pickup({
      itemId,
      ownerId,
      requesterId: req.user.id,
      meetingSpot,
      meetingTime,
    });
    await newPickup.save();
    res.json(newPickup);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.get("/api/pickup", auth, async (req, res) => {
  try {
    // Get pickups where user is either the requester or the owner
    const pickups = await Pickup.find({
      $or: [{ requesterId: req.user.id }, { ownerId: req.user.id }],
    })
      .populate("itemId")
      .populate("requesterId", "name")
      .populate("ownerId", "name");
    res.json(pickups);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.put("/api/pickup/:id", auth, async (req, res) => {
  try {
    const { status } = req.body; // status = 'accepted' or 'completed'
    const pickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (status === "completed") {
      // Mark item as returned
      await Item.findByIdAndUpdate(pickup.itemId, { status: "returned" });
    }
    res.json(pickup);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
