import React, { useState } from "react";
import { Link } from "wouter";
import * as XLSX from "xlsx";
import { API_URL } from "../config";

const CreateTest = () => {

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);

  // 📂 HANDLE FILE UPLOAD
  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = evt.target.result;

      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // convert excel → app format
      const formatted = jsonData.map((row) => {
  const options = [
    row.option1,
    row.option2,
    row.option3,
    row.option4
  ];

  return {
    question: row.question,
    options,
    correct: options.indexOf(row.correctAnswer.trim())
  };
});

      setQuestions(formatted);
    };

    reader.readAsBinaryString(file);
  };

  // 🚀 SUBMIT TEST
  const handleSubmit = async () => {
  try {
    const res = await fetch(`${API_URL}/api/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        questions
      })
    });

    const data = await res.json();

    alert("Test Saved to Database 🚀");

  } catch (err) {
    console.error(err);
    alert("Error saving test");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary p-10">

      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-3xl mx-auto">

        <h1 className="text-2xl font-bold mb-6 text-primary">
          Upload Test via Excel
        </h1>

        {/* Title */}
        <input
          type="text"
          placeholder="Test Title"
          className="w-full p-3 border rounded mb-6"
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* File Upload */}
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="mb-6"
        />

        {/* Preview */}
        {questions.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">
              Loaded {questions.length} Questions
            </h2>

            <div className="max-h-40 overflow-y-auto text-sm">
              {questions.slice(0, 5).map((q, i) => (
                <p key={i}>
                  {i + 1}. {q.question}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded"
        >
          Save Test
        </button>

        <div className="flex justify-end mb-4">
  <Link to="/company-dashboard">
    <button className="bg-white text-primary px-4 py-2 rounded-full shadow hover:shadow-lg">
      Back
    </button>
  </Link>
</div>

      </div>
    </div>
  );
};

export default CreateTest;