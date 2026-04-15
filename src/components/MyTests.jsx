import React, { useEffect, useState } from "react";
import { Link } from "wouter";

const MyTests = () => {
  const [tests, setTests] = useState([]);

  // ✅ Fetch tests from backend
  const fetchTests = async () => {
    const res = await fetch("${API_URL}/api/tests");
    const data = await res.json();
    setTests(data);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // ✅ DELETE from DB
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/api/test/${id}`, {
        method: "DELETE",
      });

      // update UI after delete
      setTests((prev) => prev.filter((test) => test._id !== id));

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6 text-white">My Tests</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {tests.map((test) => (
          <div key={test._id} className="bg-white p-6 rounded-xl shadow-lg">

            <h2 className="text-xl font-semibold">{test.title}</h2>

            <p className="text-gray-600 mt-2">
              Questions: {test.questions.length}
            </p>

            <p className="text-gray-500 text-sm mt-1">
              Created: {new Date(test.createdAt).toLocaleDateString()}
            </p>

            <div className="flex gap-3 mt-4">

              {/* ✅ VIEW */}
              <Link to={`/quiz/${test._id}`}>
                <button className="bg-blue-500 text-white px-3 py-1 rounded">
                  View
                </button>
              </Link>

              {/* ✅ EDIT */}
              <Link to={`/edit-test/${test._id}`}>
                <button className="bg-yellow-500 text-white px-3 py-1 rounded">
                  Edit
                </button>
              </Link>

              {/* ✅ DELETE */}
              <button
                onClick={() => handleDelete(test._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>

            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default MyTests;