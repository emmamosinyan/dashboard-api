const express = require("express");
const connectDB = require("./db");
const cookieParser = require("cookie-parser");
const cors = require('cors');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors());

const PORT = 5000;
connectDB();


const authRouter = require("./routes/auth");

app.use("/api/auth", authRouter);

app.get("/ping", (_, res) => {
  res.send("pong");
});

const server = app.listen(PORT, () =>
  console.log(`Server Connected to port ${PORT}`)
);
process.on("unhandledRejection", (err) => {
  console.log(`An error occurred: ${err.message}`);
  server.close(() => process.exit(1));
});
