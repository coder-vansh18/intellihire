import React, { useEffect, useState } from "react";
import { API_URL } from "../config";

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/test/results`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-10 min-h-screen bg-gradient-to-br from-primary to-secondary font-inter">
      <h1 className="text-3xl font-bold mb-6 text-white">Student Results & Proctoring Log</h1>

      {/* Analytics Modal */}
      {selectedAnalytics && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                Detailed Analytics: {selectedAnalytics.userName}
              </h3>
              <button
                onClick={() => setSelectedAnalytics(null)}
                className="text-gray-500 hover:text-gray-800 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {selectedAnalytics.score} / {selectedAnalytics.total}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Compliance Status</p>
                  <p className={`text-sm font-bold ${selectedAnalytics.disqualified ? "text-red-600" : "text-green-600"}`}>
                    {selectedAnalytics.disqualified ? "Disqualified ❌" : "Passed Verification ✅"}
                  </p>
                </div>
              </div>

              <div className="border rounded-xl p-4">
                <h4 className="font-semibold text-sm mb-2 text-gray-800">Proctoring Metrics</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-amber-50 p-2 rounded border border-amber-200">
                    <p className="text-gray-500">Tab Switches</p>
                    <p className="font-bold text-amber-700 text-sm">{selectedAnalytics.tab_switch_count || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded border border-purple-200">
                    <p className="text-gray-500">Fullscreen Exits</p>
                    <p className="font-bold text-purple-700 text-sm">{selectedAnalytics.fullscreen_exit_count || 0}</p>
                  </div>
                  <div className="bg-rose-50 p-2 rounded border border-rose-200">
                    <p className="text-gray-500">Paste Events</p>
                    <p className="font-bold text-rose-700 text-sm">{selectedAnalytics.paste_count || 0}</p>
                  </div>
                </div>
              </div>

              {selectedAnalytics.metrics && selectedAnalytics.metrics.length > 0 && (
                <div className="border rounded-xl p-4">
                  <h4 className="font-semibold text-sm mb-3 text-gray-800">Question Performance</h4>
                  <div className="space-y-2 text-xs">
                    {selectedAnalytics.metrics.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded bg-gray-50">
                        <span className="truncate w-3/4 text-gray-700">
                          {idx + 1}. {m.question_text || `Question ${idx + 1}`}
                        </span>
                        <span className={`font-semibold px-2 py-0.5 rounded ${m.is_correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {m.is_correct ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedAnalytics(null)}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-lg overflow-x-auto">
        {results.length === 0 ? (
          <p className="text-center text-gray-500">No results available yet 🚀</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-700">
                <th className="p-2">Name</th>
                <th className="p-2">Test</th>
                <th className="p-2">Score</th>
                <th className="p-2">Accuracy</th>
                <th className="p-2">Proctor Status</th>
                <th className="p-2">Date</th>
                <th className="p-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-100">
                  <td className="p-2 font-semibold">{r.userName}</td>
                  <td className="p-2">{r.testId?.title || "Test"}</td>
                  <td className="p-2">
                    {r.score} / {r.total}
                  </td>
                  <td className="p-2 text-primary font-bold">
                    {r.total > 0 ? Math.round((r.score / r.total) * 100) : 0}%
                  </td>
                  <td className="p-2 text-xs">
                    {r.disqualified ? (
                      <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                        Disqualified
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded">
                        Clean ({r.tab_switch_count || 0} violations)
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => setSelectedAnalytics(r)}
                      className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1 rounded hover:bg-indigo-100"
                    >
                      View Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentResults;