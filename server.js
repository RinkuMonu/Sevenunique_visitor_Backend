const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { options } = require("./routes/Users");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://visitor-frontend-tawny.vercel.app",
  ],
  credentials: true
}));



app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("🚀 Fintech Reception Backend Running");
});

app.use("/api/admin", require("./routes/Users"));
app.use("/api/visitors", require("./routes/Visitors"));
app.use("/api/admin/dashboard", require("./routes/adminDashboardRoutes"));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🔥 Server running on port ${PORT}`)
);
