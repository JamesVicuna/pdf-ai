import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { Settings, TextNode, VectorStoreIndex } from "llamaindex";
import { openai, OpenAIEmbedding } from "@llamaindex/openai";
import { SimpleDirectoryReader } from "@llamaindex/readers/directory";

import { BufferMemory } from "langchain/memory";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

Settings.llm = openai({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

Settings.embedModel = new OpenAIEmbedding();

// langchain chatai settings
const memory = new BufferMemory({
  memoryKey: "chat_history",
  returnMessages: true,
});
const chatModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

app.post("/query", async (req, res) => {
  const { question } = req.body;

  try {
    // query engine creation
    const dataPath = path.join(process.cwd(), "data");
    const documents = await new SimpleDirectoryReader().loadData({
      directoryPath: dataPath,
    });
    const index = await VectorStoreIndex.fromDocuments(documents);
    const queryEngine = index.asQueryEngine();

    // Relevant nodes of context from document from querying the question to the engine
    const receivedNodes = await queryEngine.retrieve({ query: question });
    const contextText = receivedNodes
      .map((item) => (item.node as TextNode).text)
      .join("\n\n");

    // Prompt for the AI to follow when having a chat. Takes in user input, previous chat history, and contextText.
    const chatPrompt = ChatPromptTemplate.fromMessages([
      // chatTemplate
      [
        "system",
        "you are an assistant who answers questions based on the document based on the context. \n context: {context}",
      ],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    // Chain to invoke prompt and pass it to our llm. 
    const chatChain = RunnableSequence.from([chatPrompt, chatModel]);
    const response = await chatChain.invoke({
      context: contextText,
      input: question,
      chat_history: await memory
        .loadMemoryVariables({})
        .then((v) => v.chat_history),
    });

    // saves the response and human question from chat into memory
    await memory.saveContext({ input: question }, { output: response.content });

    res.json({ question: question, answer: response.content });
  } catch (error) {
    console.error("Query error:", error);
    res.json({ error });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
