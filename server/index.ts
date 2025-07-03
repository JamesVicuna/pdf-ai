import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";

//LANGCHAIN
import { BufferMemory } from "langchain/memory";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { StringOutputParser } from "@langchain/core/output_parsers";

import pdfParse from "pdf-parse";
import { v4 as uuidv4 } from "uuid";

import { client } from "./db/supbase";
import { vectorStore } from "./utils/vectorStore";
import { combineDocuments } from "./utils/combineDocuments";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Settings.llm = openai({
//   apiKey: process.env.OPENAI_API_KEY,
//   model: "gpt-4o",
// });

// Settings.embedModel = new OpenAIEmbedding();

// langchain chatai settings
const embeddings = new OpenAIEmbeddings({});
const memory = new BufferMemory({
  memoryKey: "chat_history",
  returnMessages: true,
});
const chatModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/uploadPdf", upload.single("pdf"), async (req, res) => {
  try {
    const fileBuffer = req.file?.buffer;

    if (!fileBuffer) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const data = await pdfParse(fileBuffer);
    const text = data.text;

    const splitter = new RecursiveCharacterTextSplitter({});
    const output = await splitter.createDocuments([text]);
    const docId = uuidv4();

    const documentsWithId = output.map((doc) => {
      doc.metadata.docId = docId;
      return doc;
    });

    await SupabaseVectorStore.fromDocuments(documentsWithId, embeddings, {
      client: client(),
      tableName: "documents",
    });

    res.status(200).json({ message: "PDF parsed", docId });
  } catch (error) {
    res.status(500).json({ error: "Failed to parse PDF" });
  }
});

app.post("/query", async (req, res) => {
  const { question, docId } = req.body;

  try {
    const store = vectorStore(embeddings);
    const retriever = store.asRetriever({
      filter: {
        docId: docId,
      },
    });

    const standAloneQuestionTemplate =
      "Given a question, convert it into a standalone question. question: {question} standalone_question:";
    const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
      standAloneQuestionTemplate
    );

    const standaloneQuestionChain = RunnableSequence.from([
      standaloneQuestionPrompt,
      new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o",
      }),
      new StringOutputParser(),
    ]);

    const retrieverChain = RunnableSequence.from([
      (prevResult) => prevResult.standalone_question,
      retriever,
      combineDocuments,
    ]);

    const chatPrompt = ChatPromptTemplate.fromMessages([
      // chatTemplate
      [
        "system",
        "you are an assistant who answers questions based on the document based on the context. \n context: {context}",
      ],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    const chatChain = RunnableSequence.from([
      chatPrompt,
      chatModel,
      new StringOutputParser(),
    ]);

    const chain = RunnableSequence.from([
      { standalone_question: standaloneQuestionChain },
      {
        context: retrieverChain,
        input: prevResult => prevResult.standalone_question,
        chat_history: async () => {
          const memoryVars = await memory.loadMemoryVariables({});
          return memoryVars.chat_history;
        }
      },
      chatChain,
    ]);

    const response = await chain.invoke({ question });
    await memory.saveContext({ input: question }, { output: response });

    res.json({ input: question, output: response });

    
  } catch (error) {
    console.error("Query error:", error);
    res.json({ error });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
