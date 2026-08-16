import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import * as XLSX from "xlsx";
import { API_URL } from "../config";
import { FaUpload, FaUsers, FaBuilding, FaCalendarAlt, FaLayerGroup, FaGlobe, FaLock } from "react-icons/fa";

const CreateTest = () => {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Target Assignment States
  const [isPublic, setIsPublic] = useState(false);
  const [targetBranch, setTargetBranch] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [targetSection, setTargetSection] = useState("");

  // 📂 HANDLE FILE UPLOAD WITH ROBUST EXCEL PARSING
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Convert excel → app format
      const formatted = jsonData.map((row) => {
        const qText = String(row.question || row.Question || row.QUESTION || "").trim();

        const options = [
          String(row.option1 || row.Option1 || row.OPTION1 || "").trim(),
          String(row.option2 || row.Option2 || row.OPTION2 || "").trim(),
          String(row.option3 || row.Option3 || row.OPTION3 || "").trim(),
          String(row.option4 || row.Option4 || row.OPTION4 || "").trim()
        ];

        const rawCorrect = String(
          row.correct !== undefined ? row.correct : 
          row.correctAnswer !== undefined ? row.correctAnswer : 
          row.Correct !== undefined ? row.Correct : 
          row.CorrectAnswer !== undefined ? row.CorrectAnswer : ""
        ).trim();

        let correctIdx = 0; // Default to first option

        // Strategy 1: Case-insensitive exact text match against option values (e.g. "Language", "to style")
        const matchedOptIdx = options.findIndex((opt) => opt.toLowerCase() === rawCorrect.toLowerCase());
        if (matchedOptIdx !== -1) {
          correctIdx = matchedOptIdx;
        } else {
          // Strategy 2: Check "A", "B", "C", "D" / "a", "b", "c", "d" letter codes
          const letterMap = { a: 0, b: 1, c: 2, d: 3, A: 0, B: 1, C: 2, D: 3 };
          if (letterMap[rawCorrect] !== undefined) {
            correctIdx = letterMap[rawCorrect];
          } else {
            // Strategy 3: Check "option1", "option 1", "option2"
            const optStrMatch = rawCorrect.toLowerCase().match(/option\s*([1-4])/);
            if (optStrMatch) {
              correctIdx = parseInt(optStrMatch[1], 10) - 1;
            } else {
              // Strategy 4: Numeric 1-indexed (1, 2, 3, 4) vs 0-indexed (0, 1, 2, 3)
              const parsedNum = parseInt(rawCorrect, 10);
              if (!isNaN(parsedNum)) {
                if (parsedNum >= 1 && parsedNum <= options.length) {
                  correctIdx = parsedNum - 1;
                } else if (parsedNum === 0) {
                  correctIdx = 0;
                }
              }
            }
          }
        }

        if (correctIdx < 0 || correctIdx >= options.length) {
          correctIdx = 0;
        }

        return {
          question: qText,
          options,
          correct: correctIdx
        };
      });

      setQuestions(formatted);
    };

    reader.readAsBinaryString(file);
  };

  // 🚀 SUBMIT TEST & ASSIGNMENT
  const handleSubmit = async () => {
    if (!title) {
      alert("Please provide a title for the test.");
      return;
    }
    if (!questions.length) {
      alert("Please upload questions via Excel.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : ""
      };

      // 1. Create Test
      const res = await fetch(`${API_URL}/api/tests`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          duration_minutes: Number(durationMinutes) || 60,
          is_public: isPublic,
          questions
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Error saving test");
        setLoading(false);
        return;
      }

      const testId = data.test.id || data.test._id;

      // 2. Assign Test if target branch/year/section is specified
      if (!isPublic && (targetBranch || targetYear || targetSection)) {
        await fetch(`${API_URL}/api/tests/${testId}/assign`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            branch: targetBranch || null,
            year: targetYear || null,
            section: targetSection || null
          })
        });
      }

      alert("Test Created & Assigned Successfully 🚀");
      setLocation("/my-tests");
    } catch (err) {
      console.error(err);
      alert("Error saving test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary p-6 md:p-10 font-inter">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create & Assign Assessment</h1>
            <p className="text-sm text-gray-500">Upload questions and set target branch / section visibility</p>
          </div>
          <Link to="/company-dashboard">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full shadow text-sm font-semibold transition">
              Back to Dashboard
            </button>
          </Link>
        </div>

        {/* 1. Basic Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assessment Title</label>
            <input
              type="text"
              placeholder="e.g. Data Structures Midterm Exam"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-gray-800 font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (Minutes)</label>
            <input
              type="number"
              placeholder="60"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-gray-800 font-medium"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Target Audience & Visibility (Requirement) */}
        <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-100 mb-6 space-y-4">
          <h2 className="text-base font-bold text-indigo-900 flex items-center gap-2">
            <FaUsers className="text-indigo-600" /> Target Audience & Assignment Rules
          </h2>

          {/* Access Type Toggle */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition ${
                !isPublic
                  ? "bg-white border-indigo-600 ring-2 ring-indigo-500 shadow-sm"
                  : "bg-white/60 border-gray-200 hover:bg-white"
              }`}
            >
              <FaLock className={!isPublic ? "text-indigo-600" : "text-gray-400"} />
              <div>
                <p className="text-sm font-semibold text-gray-900">Private Assessment</p>
                <p className="text-xs text-gray-500">Assigned to specific Branch / Year / Section</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition ${
                isPublic
                  ? "bg-white border-indigo-600 ring-2 ring-indigo-500 shadow-sm"
                  : "bg-white/60 border-gray-200 hover:bg-white"
              }`}
            >
              <FaGlobe className={isPublic ? "text-indigo-600" : "text-gray-400"} />
              <div>
                <p className="text-sm font-semibold text-gray-900">Public Practice Test</p>
                <p className="text-xs text-gray-500">Visible to all students on platform</p>
              </div>
            </button>
          </div>

          {/* Branch / Year / Section Selectors (When Private) */}
          {!isPublic && (
            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <FaBuilding className="text-indigo-500" /> Target Branch
                </label>
                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="">All Branches</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Electronics & Comm.">Electronics & Comm. (ECE)</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <FaCalendarAlt className="text-indigo-500" /> Target Year
                </label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <FaLayerGroup className="text-indigo-500" /> Target Section
                </label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="">All Sections</option>
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Section C">Section C</option>
                  <option value="Section D">Section D</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 3. Excel File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FaUpload className="text-indigo-600" /> Excel File (.xlsx, .xls)
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
        </div>

        {/* Excel Preview */}
        {questions.length > 0 && (
          <div className="mb-6 bg-gray-50 p-4 rounded-xl border">
            <h2 className="font-semibold text-gray-800 mb-2">
              Loaded {questions.length} Questions
            </h2>
            <div className="max-h-36 overflow-y-auto text-sm space-y-1.5 text-gray-600 pr-2">
              {questions.slice(0, 5).map((q, i) => (
                <p key={i} className="truncate">
                  <span className="font-bold text-gray-800">{i + 1}.</span> {q.question}
                </p>
              ))}
              {questions.length > 5 && <p className="italic text-gray-400 text-xs">...and {questions.length - 5} more questions</p>}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold px-6 py-3.5 rounded-xl shadow-lg hover:opacity-95 transition disabled:opacity-60"
        >
          {loading ? "Creating & Assigning..." : "Save & Assign Assessment"}
        </button>
      </div>
    </div>
  );
};

export default CreateTest;