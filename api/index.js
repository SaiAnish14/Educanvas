require("dotenv").config();
const express = require("express");
const cors = require("cors");
const curriculumRoutes = require("../server/routes/curriculum");
const chatRoutes = require("../server/routes/chat");
const statsRoutes = require("../server/routes/stats");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/curriculum", curriculumRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stats", statsRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;
