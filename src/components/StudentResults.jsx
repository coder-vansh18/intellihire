import React, { useEffect, useState } from "react";

const StudentResults = () => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch("${API_URL}/api/test/results")
      .then(res => res.json())
      .then(data => setResults(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6 text-white">
        Student Results
      </h1>

      <div className="bg-white rounded-xl p-6 shadow-lg overflow-x-auto">

        {results.length === 0 ? (
          <p className="text-center text-gray-500">
            No results available yet 🚀
          </p>
        ) : (

          <table className="w-full text-left">

            <thead>
              <tr className="border-b text-gray-700">
                <th className="p-2">Name</th>
                <th className="p-2">Test</th>
                <th className="p-2">Score</th>
                <th className="p-2">Accuracy</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>

            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-100">

                  <td className="p-2 font-semibold">
                    {r.userName}
                  </td>

                  <td className="p-2">
                    {r.testId?.title || "Test"}
                  </td>

                  <td className="p-2">
                    {r.score} / {r.total}
                  </td>

                  <td className="p-2 text-primary font-bold">
                    {Math.round((r.score / r.total) * 100)}%
                  </td>

                  <td className="p-2 text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
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