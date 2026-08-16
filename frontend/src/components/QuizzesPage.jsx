import React, { useState, useEffect } from 'react';
import { FaPlay, FaFilter } from 'react-icons/fa';
import { Link } from 'wouter';
import axios from 'axios';
import { API_URL } from "../config";

const QuizzesPage = () => {
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [tests, setTests] = useState([]);

  // Load user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch tests with Authorization header
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/tests`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setTests(res.data);
      } catch (err) {
        console.error("Error fetching tests:", err);
      }
    };

    fetchTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">

      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-10">
        <div className="text-2xl font-bold text-primary">
          <Link to="/">IntelliHire</Link>
        </div>

        <ul className="flex space-x-8 list-none">
          <li><Link to="/" className="hover:text-primary">Home</Link></li>
          <li><Link to="/quizzes" className="hover:text-primary">Quizzes</Link></li>
          <li><Link to="/placements" className="hover:text-primary">Placements</Link></li>
          <li><Link to="/resources" className="hover:text-primary">Resources</Link></li>
        </ul>

        {user ? (
          <span className="font-semibold text-primary">👤 {user.name}</span>
        ) : (
          <Link to="/login">
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">
              Login / Signup
            </button>
          </Link>
        )}
      </nav>

      {/* Header */}
      <header className="text-center p-16 bg-white">
        <h1 className="text-4xl font-bold mb-4">Mock Tests & Campus Assessments</h1>
        <p className="text-lg">Select a test and simulate real exam experience with anti-cheat proctoring</p>
      </header>

      {/* Filters */}
      <section className="flex justify-center items-center p-8 bg-gray-100 gap-4">
        <FaFilter className="text-2xl text-primary" />
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
          className="p-3 border rounded-lg"
        >
          <option value="all">All Available Tests</option>
        </select>
      </section>

      {/* Tests from DB */}
      <section className="p-16 bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {tests.length === 0 ? (
            <p className="text-center col-span-3 text-gray-500 font-medium">No tests currently available for your account.</p>
          ) : (
            tests.map((test) => {
              const tId = test._id || test.id;
              return (
                <div key={tId} className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{test.title}</h3>

                    <p className="text-gray-600 mb-2">
                      {test.questions ? test.questions.length : 0} Questions
                    </p>

                    <p className="text-sm text-gray-500 mb-4">
                      ⏱ Duration: {test.duration_minutes || 60} mins
                    </p>
                  </div>

                  <Link to={`/quiz/${tId}`}>
                    <button className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2.5 rounded-full flex items-center gap-2 mx-auto font-semibold shadow hover:opacity-95 transition">
                      <FaPlay /> Start Test
                    </button>
                  </Link>

                </div>
              );
            })
          )}

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center">
        <p>© 2026 IntelliHire. All rights reserved.</p>
        <Link to="/" className="text-primary">Back to Home</Link>
      </footer>
    </div>
  );
};

export default QuizzesPage;