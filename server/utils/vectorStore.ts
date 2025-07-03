import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Embeddings } from "@langchain/core/embeddings";
import { client } from "../db/supbase";

export const vectorStore = (embeddings: Embeddings) => {
  return new SupabaseVectorStore(embeddings, {
    client: client(),
    tableName: "documents",
    queryName: "match_documents",
  });
};
