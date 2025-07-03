import { Document } from "@langchain/core/documents"
export const combineDocuments = (docs: Document[]) => {
  return docs.map((doc) => doc.pageContent).join('\n\n')
}