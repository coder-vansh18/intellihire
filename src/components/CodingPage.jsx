import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { Link } from "wouter";

const CodingPage = () => {

const [code, setCode] = useState("// Write your code here");
const [problem, setProblem] = useState(null);
const [output, setOutput] = useState("");


// Fetch random coding problem
const fetchProblem = async () => {

try {

const res = await axios.get(
"https://codeforces.com/api/problemset.problems"
);

const problems = res.data.result.problems;

const random =
problems[Math.floor(Math.random() * problems.length)];

setProblem(random);

} catch (err) {
console.log(err);
}

};

useEffect(() => {
fetchProblem();
}, []);


// Run code using Judge0 API
const runCode = async () => {

try {

const response = await axios.post(
"https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
{
source_code: code,
language_id: 54, // C++
stdin: ""
},
{
headers: {
"Content-Type": "application/json",
"X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
"X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
}
}
);

setOutput(response.data.stdout || response.data.stderr);

} catch (error) {

setOutput("Error running code");

}

};


return (

<div className="min-h-screen p-10 bg-gray-100">

<h1 className="text-3xl font-bold mb-4">Coding Practice</h1>

{problem && (
<div className="bg-white p-4 rounded shadow mb-6">

<h2 className="text-xl font-semibold">
{problem.name}
</h2>

<p className="text-gray-600">
Tags: {problem.tags.join(", ")}
</p>

</div>
)}

<Editor
height="400px"
defaultLanguage="cpp"
value={code}
onChange={(value) => setCode(value)}
/>

<div className="flex gap-4 mt-4">

<button
onClick={runCode}
className="bg-green-500 text-white px-4 py-2 rounded"
>
Run Code
</button>

<button
onClick={fetchProblem}
className="bg-blue-500 text-white px-4 py-2 rounded"
>
Next Problem
</button>

</div>

<div className="bg-black text-green-400 mt-6 p-4 rounded">
Output:
{output}
</div>

<Link to="/">
<button className="mt-6 bg-gray-500 text-white px-4 py-2 rounded">
Back
</button>
</Link>

</div>

);

};

export default CodingPage;