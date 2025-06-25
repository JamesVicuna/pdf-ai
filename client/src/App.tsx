import "./App.css";
import { useState, useEffect } from "react";
import axios from "axios";

function App() {

  const [error, setError] = useState<any>(null);
  const [response, setResponse] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
       
        const res = await axios.post("http://localhost:5001/query", {
          question: "what is this document about?",
        });

        const data = res.data
        setResponse(data);
        setError(null); // clear error if previously set
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Something went wrong. Please try again.");
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>hello world</h1>
      {response && (
        <div>
          <p>{response.question}</p>
          <p>{response.answer}</p>
        </div>
      )}
    </div>
  );
}

export default App;
