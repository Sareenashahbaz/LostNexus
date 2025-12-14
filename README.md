#  LostNexus: Campus Lost & Found Portal

Welcome to **LostNexus**, your campus’s official lost and found web app! Whether you’re a student or staff, this portal makes it easy to recover lost items quickly—no more messy bulletin boards or endless WhatsApp messages. LostNexus centralizes the process with smart matching and a structured pickup system so nothing goes missing for long.

---

##  Key Features

* **Secure Login:** Separate roles for Students, Staff, and Admins to keep the system organized.
* **Easy Item Submission:** Report lost or found items in just a few clicks, with optional image uploads.
* **Smart Matching Engine:** The system automatically suggests potential matches based on **category, color, location, and date**.
* **Pickup Coordination:** Built-in workflow ensures a safe, confirmed handover between the finder and the owner.
* **Admin Dashboard:** Admins can approve posts, monitor recovery stats, and keep the system running smoothly.

---

##  Technology Stack

LostNexus is built on the **MERN stack**—MongoDB, Express, React, and Node.js—giving you a modern, fast, and scalable experience.

| Area           | Technology            | Purpose                                    |
| -------------- | --------------------- | ------------------------------------------ |
| Frontend       | React.js              | Responsive and interactive user interface  |
| Backend        | Node.js, Express.js   | API requests, server logic, and operations |
| Database       | MongoDB Atlas         | Flexible storage for users and items       |
| Authentication | JWT (JSON Web Tokens) | Secure login and session management        |

---

##  Getting Started

Here’s how to run LostNexus locally:

### 1. Prerequisites

Make sure you have installed:

* **Node.js** (LTS recommended)
* **Git** (optional, but helpful)

### 2. Set Up Project Structure

```bash
mkdir LostNexus
cd LostNexus
```

---

### 3. Backend Setup (server)

```bash
mkdir server
cd server
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken nodemon
```

Create a `.env` file in the server folder with your configurations:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=a_strong_secret_key_for_jwt
```

Add your server code to `index.js` and run:

```bash
node index.js
```

Keep this terminal open.

---

### 4. Frontend Setup (client)

Open a new terminal:

```bash
cd ..   # Back to LostNexus folder
npx create-react-app client
cd client
npm install axios react-router-dom jwt-decode
```

Replace `src/App.js` and `src/App.css` with your project files.

Start the client:

```bash
npm start
```

Your app will open at [http://localhost:3000](http://localhost:3000).

---

##  How to Use LostNexus

1. **Register:** Create an account (default role: Student).
2. **Report an Item:** Go to the `/post` page and submit a lost or found item.
3. **Find Matches:** Click **“View & Match”** to see items that closely match yours.
4. **Coordinate Pickup:** Propose a meeting time and location with the other user.
5. **Confirm Handover:** The other party can accept or mark the item as handed over, completing the process.

---

LostNexus makes losing things on campus a little less stressful—and finding them, much faster.

---

