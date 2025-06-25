import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";
import { VectorStoreIndex } from "llamaindex";
import { openai, OpenAIEmbedding } from "@llamaindex/openai";
import { SimpleDirectoryReader } from "@llamaindex/readers/directory";

// const express = require("express");
// const cors = require("cors");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.post("/query", async (req, res) => {
  res.json({test: "Server is working!"})
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// console.log('we got here')

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.get("/", (req, res) => {
//   res.send("Hello world!");
// });

// app.listen(PORT, () => {
//   console.log(`Server is listening on port ${PORT}`);
// });

// const app = express();
// app.use(cors())
// const PORT = 5001;

// app.get("/", (req, res) => {
//   res.json({test: "hello"});
// });

// app.listen(PORT, () => {
//   console.log(`Server is listening on port ${PORT}`);
// });

// Optional: keep process alive visibly
