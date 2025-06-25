import "./App.css";
import { useState, useEffect } from "react";
import axios from "axios";


function App() {

  const [test, setTest] = useState<any>(null)
  console.log(test)


  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.post('http://localhost:5001/query')
        setTest(res.data?.test)
      } catch (error) {
        setTest('error')
      }
    }

    fetch()
  }, [])

  return (
    <>
      <div>hello world</div>
      {test && (
        <div>
          {test}
        </div>
      )}
    </>
  );
}

export default App;
