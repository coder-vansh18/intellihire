import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

const CodeEditor = () => {

  const [code, setCode] = useState("// write your code here");
  const [output, setOutput] = useState("");

  const runCode = async () => {
    const response = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: 54, // C++
        stdin: ""
      },
      {
        headers: {
          "X-RapidAPI-Key": "YOUR_RAPID_API_KEY",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json"
        }
      }
    );

    setOutput(response.data.stdout || response.data.stderr);
  };

  return (
    <div style={{padding:"20px"}}>
      <h2>Online Coding Editor</h2>

      <Editor
        height="400px"
        defaultLanguage="cpp"
        value={code}
        onChange={(value)=>setCode(value)}
      />

      <button onClick={runCode}>Run Code</button>

      <h3>Output</h3>
      <pre>{output}</pre>
    </div>
  );
};

export default CodeEditor;