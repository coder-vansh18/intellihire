import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import * as XLSX from "xlsx";
import { API_URL } from "../config";
import { FaUpload, FaUsers, FaBuilding, FaCalendarAlt, FaLayerGroup, FaGlobe, FaLock, FaCheckCircle, FaClock, FaBook } from "react-icons/fa";

// Helper function to strip HTML tags and decode entities
const cleanHtmlText = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const CreateTest = () => {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detectedMeta, setDetectedMeta] = useState(null);

  // Target Assignment States
  const [isPublic, setIsPublic] = useState(false);
  const [targetBranch, setTargetBranch] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [targetSection, setTargetSection] = useState("");

  // 📂 HANDLE FILE UPLOAD SUPPORTING ENTERPRISE MULTI-SHEET & SINGLE-SHEET TEMPLATES
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: "binary" });

        let parsedTitle = "";
        let parsedDuration = null;
        let questionsRows = null;

        // 1. Scan all sheets for metadata (Header / Info sheet) and question bank
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const rawGrid = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          // Check if this sheet contains key-value metadata (e.g. Header | Value)
          for (const row of rawGrid) {
            if (Array.isArray(row) && row.length >= 2) {
              const key = String(row[0] || "").toLowerCase().trim();
              const val = row[1];
              if (["name", "test name", "assessment name", "title"].includes(key) && val) {
                parsedTitle = cleanHtmlText(val);
              } else if (["time allocated", "duration", "duration (minutes)", "time (minutes)", "time"].includes(key) && val) {
                const num = parseInt(val, 10);
                if (!isNaN(num) && num > 0) parsedDuration = num;
              }
            }
          }

          // Check if this sheet contains question records
          const jsonSheet = XLSX.utils.sheet_to_json(sheet);
          if (jsonSheet.length > 0) {
            const firstRow = jsonSheet[0];
            const colKeys = Object.keys(firstRow).map((k) => k.toLowerCase().trim());
            const hasQuestionCol = colKeys.some((k) => k.includes("question"));
            const hasOptionCol = colKeys.some((k) => k.includes("option 1") || k.includes("option1") || k.includes("option 2") || k.includes("option2"));

            if (hasQuestionCol || hasOptionCol) {
              questionsRows = jsonSheet;
            }
          }
        }

        // Fallback: if no dedicated question sheet detected, use sheet 2 or sheet 1
        if (!questionsRows && workbook.SheetNames.length > 0) {
          if (workbook.SheetNames.length > 1) {
            questionsRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);
          } else {
            questionsRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
          }
        }

        // 2. Parse & Format Questions
        const formatted = (questionsRows || []).map((row) => {
          // Find Question text across potential column headers
          const rawQ =
            row.Question ||
            row.question ||
            row.QUESTION ||
            row["Question Text"] ||
            row["question text"] ||
            row.Instruction ||
            "";
          const qText = cleanHtmlText(rawQ);

          // Extract Options (supporting Option 1..5, Option1..5, A..D, etc.)
          const rawOptions = [
            row["Option 1"] || row.option1 || row.Option1 || row.OPTION1 || row.A || "",
            row["Option 2"] || row.option2 || row.Option2 || row.OPTION2 || row.B || "",
            row["Option 3"] || row.option3 || row.Option3 || row.OPTION3 || row.C || "",
            row["Option 4"] || row.option4 || row.Option4 || row.OPTION4 || row.D || "",
            row["Option 5"] || row.option5 || row.Option5 || row.OPTION5 || row.E || ""
          ]
            .map((opt) => cleanHtmlText(opt))
            .filter((opt) => opt !== ""); // Remove empty trailing options

          // Extract Answer / Correct option
          const rawAnswer = String(
            row.Answers !== undefined ? row.Answers :
            row.answers !== undefined ? row.answers :
            row.Answer !== undefined ? row.Answer :
            row.answer !== undefined ? row.answer :
            row.correct !== undefined ? row.correct :
            row.Correct !== undefined ? row.Correct :
            row.correctAnswer !== undefined ? row.correctAnswer :
            row.CorrectAnswer !== undefined ? row.CorrectAnswer :
            row["Correct Option"] !== undefined ? row["Correct Option"] : ""
          ).trim();

          const cleanedAnswerText = cleanHtmlText(rawAnswer);
          let correctIdx = 0;

          // Strategy 1: Numeric Index (e.g. "2" for Option 2 -> index 1, "1" -> index 0)
          const parsedNum = parseInt(cleanedAnswerText, 10);
          if (!isNaN(parsedNum)) {
            if (parsedNum >= 1 && parsedNum <= rawOptions.length) {
              correctIdx = parsedNum - 1; // 1-based index to 0-based
            } else if (parsedNum === 0) {
              correctIdx = 0;
            }
          } else {
            // Strategy 2: Match exact option text
            const matchedIdx = rawOptions.findIndex(
              (opt) => opt.toLowerCase() === cleanedAnswerText.toLowerCase()
            );
            if (matchedIdx !== -1) {
              correctIdx = matchedIdx;
            } else {
              // Strategy 3: Letter code ("A", "B", "C", "D", "E")
              const letterMap = { a: 0, b: 1, c: 2, d: 3, e: 4, A: 0, B: 1, C: 2, D: 3, E: 4 };
              if (letterMap[cleanedAnswerText] !== undefined) {
                correctIdx = letterMap[cleanedAnswerText];
              } else {
                // Strategy 4: "Option 1", "Option 2" format
                const matchOptStr = cleanedAnswerText.toLowerCase().match(/option\s*([1-5])/);
                if (matchOptStr) {
                  correctIdx = parseInt(matchOptStr[1], 10) - 1;
                }
              }
            }
          }

          if (correctIdx < 0 || correctIdx >= rawOptions.length) {
            correctIdx = 0;
          }

          return {
            question: qText,
            options: rawOptions,
            correct: correctIdx
          };
        }).filter((q) => q.question && q.options.length >= 2);

        // Auto-fill Title and Duration if detected
        if (parsedTitle) {
          setTitle(parsedTitle);
        }
        if (parsedDuration) {
          setDurationMinutes(parsedDuration);
        }

        setDetectedMeta({
          title: parsedTitle || "Auto-detected",
          duration: parsedDuration || 30,
          totalQuestions: formatted.length
        });

        setQuestions(formatted);
      } catch (err) {
        console.error("Failed to parse Excel workbook", err);
        alert("Could not parse the Excel file. Please ensure it contains valid question and option columns.");
      }
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
          duration_minutes: Number(durationMinutes) || 30,
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

      alert("Assessment Created & Assigned Successfully 🚀");
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
            <p className="text-sm text-gray-500">Upload enterprise test templates with auto-extracted title & duration</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/company-dashboard">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full shadow text-sm font-semibold transition">
                Dashboard
              </button>
            </Link>
            <Link to="/profile">
              <button 
                className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-primary focus:outline-none transition"
                title="Profile"
              >
                <img
                  src="/assets/avatar.png"
                  alt="Profile Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-sm hover:scale-105 transition duration-150"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://api.dicebear.com/7.x/bottts/svg?seed=user";
                  }}
                />
              </button>
            </Link>
          </div>
        </div>

        {/* 1. Basic Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Assessment Title</span>
              {detectedMeta?.title && (
                <span className="text-xs font-normal text-emerald-600 flex items-center gap-1">
                  <FaCheckCircle /> Auto-extracted from Excel
                </span>
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. DS_FSD_Test-2"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-gray-800 font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Duration (Minutes)</span>
              {detectedMeta?.duration && (
                <span className="text-xs font-normal text-emerald-600 flex items-center gap-1">
                  <FaClock /> Auto-extracted ({durationMinutes} mins)
                </span>
              )}
            </label>
            <input
              type="number"
              placeholder="30"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-gray-800 font-medium"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Target Audience & Visibility */}
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
            <FaUpload className="text-indigo-600" /> Excel Template (.xlsx, .xls)
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
        </div>

        {/* Excel Questions Preview */}
        {questions.length > 0 && (
          <div className="mb-6 bg-gray-50 p-4 rounded-xl border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <FaBook className="text-indigo-600" /> Loaded {questions.length} Questions
              </h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
                Ready to Save
              </span>
            </div>
            
            <div className="max-h-48 overflow-y-auto text-sm space-y-2.5 text-gray-700 pr-2">
              {questions.slice(0, 6).map((q, i) => (
                <div key={i} className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-1">
                    <span className="text-indigo-600">{i + 1}.</span> {q.question}
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    {q.options.map((opt, optI) => (
                      <span
                        key={optI}
                        className={`truncate p-1 rounded ${
                          optI === q.correct ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200" : ""
                        }`}
                      >
                        {String.fromCharCode(65 + optI)}. {opt} {optI === q.correct ? "✓" : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {questions.length > 6 && (
                <p className="italic text-gray-500 text-xs text-center pt-1">
                  ...and {questions.length - 6} more questions loaded successfully
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || questions.length === 0}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold px-6 py-3.5 rounded-xl shadow-lg hover:opacity-95 transition disabled:opacity-50"
        >
          {loading ? "Creating & Assigning..." : `Save & Assign Assessment (${questions.length} Questions)`}
        </button>
      </div>
    </div>
  );
};

export default CreateTest;