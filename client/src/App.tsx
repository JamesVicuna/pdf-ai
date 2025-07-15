import "./App.css";
import { useState } from "react";
import axios from "axios";
import { useRecoilValue } from "recoil";

import { NewPdf, docIdState } from "./components/NewPdf";
import { MessageBubble } from "./components/MessageBubble";

function App() {
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const docId = useRecoilValue(docIdState);

  const askQuestion = async () => {
    setMessages((messages) => [...messages, question]);
    setLoading(true);
    setQuestion("");

    try {
      const res = await axios.post("http://localhost:5001/query", {
        question,
        docId,
      });

      const data = res.data;

      setMessages((messages) => [...messages, data.output]);
      setError(null);
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 m-4">
      <div className="flex flex-row">
        <div className="w-1/2 flex justify-center">
          <NewPdf />
        </div>
        <div className="w-1/2 flex flex-col max-h-[calc(100vh-4rem)]">
          <div className=" rounded-xl bg-primary-content h-full flex flex-col justify-between w-full p-4">
            <div className="flex-1 overflow-y-auto mb-4">
              {messages.map((message, i) => (
                <>
                  <MessageBubble
                    message={message}
                    position={i % 2 === 0 ? "end" : "start"}
                  />
                </>
              ))}
            </div>
            <form
              className="w-full flex justify-end space-x-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading && question.trim()) askQuestion();
              }}
            >
              <input
                type="text"
                placeholder={
                  docId ? "Ask a question" : "Upload a PDF to get started"
                }
                className="input w-full"
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loading || !docId}
                value={question}
              />
              <button
                type="submit"
                className="btn bg-accent-content"
                disabled={loading || !docId}
              >
                Ask
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
