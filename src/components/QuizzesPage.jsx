// import React, { useState, useEffect } from 'react';
// import { FaCode, FaBrain, FaCalculator, FaBook, FaPlay, FaFilter } from 'react-icons/fa';
// import { Link } from 'wouter';

// const QuizzesPage = () => {
//   const [filter, setFilter] = useState('all');
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");
//     if (storedUser && storedUser !== "undefined") {
//       setUser(JSON.parse(storedUser));
//     }
//   }, []);

//   const quizzes = [
//     { id: 1, title: 'JavaScript Basics', type: 'coding', description: 'Test your JS fundamentals.', icon: <FaCode />, difficulty: 'Easy', questions: 10, duration: '10 min' },
//     { id: 2, title: 'Aptitude Test', type: 'aptitude', description: 'Logical reasoning and math.', icon: <FaBrain />, difficulty: 'Medium', questions: 15, duration: '15 min' },
//     { id: 3, title: 'Data Structures Quiz', type: 'coding', description: 'Arrays, trees, and graphs.', icon: <FaCalculator />, difficulty: 'Hard', questions: 20, duration: '20 min' },
//     { id: 4, title: 'Core Subjects MCQ', type: 'core', description: 'CS fundamentals.', icon: <FaBook />, difficulty: 'Medium', questions: 12, duration: '12 min' },
//   ];

//   const filteredQuizzes = filter === 'all' ? quizzes : quizzes.filter(q => q.type === filter);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">

//       {/* Navbar */}
//       <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-10">
//         <div className="text-2xl font-bold text-primary">
//           <Link to="/">IntelliHire</Link>
//         </div>

//         <ul className="flex space-x-8 list-none">
//           <li><Link to="/" className="hover:text-primary">Home</Link></li>
//           <li><Link to="/quizzes" className="hover:text-primary">Quizzes</Link></li>
//           <li><Link to="/placements" className="hover:text-primary">Placements</Link></li>
//           <li><Link to="/resources" className="hover:text-primary">Resources</Link></li>
//         </ul>

//         {/* ✅ Auth UI */}
//         {user ? (
//           <span className="font-semibold text-primary">👤 {user.name}</span>
//         ) : (
//           <Link to="/login">
//             <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">
//               Login / Signup
//             </button>
//           </Link>
//         )}
//       </nav>

//       {/* Header */}
//       <header className="text-center p-16 bg-white">
//         <h1 className="text-4xl font-bold mb-4">Mock Tests & Quizzes</h1>
//         <p className="text-lg">Select a test and simulate real exam experience</p>
//       </header>

//       {/* Filters */}
//       <section className="flex justify-center items-center p-8 bg-gray-100 gap-4">
//         <FaFilter className="text-2xl text-primary" />
//         <select 
//           value={filter} 
//           onChange={(e) => setFilter(e.target.value)} 
//           className="p-3 border rounded-lg"
//         >
//           <option value="all">All Tests</option>
//           <option value="coding">Coding</option>
//           <option value="aptitude">Aptitude</option>
//           <option value="core">Core Subjects</option>
//         </select>
//       </section>

//       {/* Quiz Cards */}
//       <section className="p-16 bg-gray-100">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
//           {filteredQuizzes.map(quiz => (
//             <div key={quiz.id} className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">

//               <div className="text-4xl text-primary mb-4">{quiz.icon}</div>

//               <h3 className="text-xl font-semibold mb-2">{quiz.title}</h3>
//               <p className="text-gray-600 mb-4">{quiz.description}</p>

//               <div className="text-sm mb-4">
//                 <p>📊 Questions: {quiz.questions}</p>
//                 <p>⏱ Duration: {quiz.duration}</p>
//                 <p className="font-bold text-primary">Difficulty: {quiz.difficulty}</p>
//               </div>

//               <Link to={`/quiz/${quiz.id}`}>
//                 <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full flex items-center gap-2 mx-auto">
//                   <FaPlay /> Start Test
//                 </button>
//               </Link>

//             </div>
//           ))}

//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-800 text-white p-8 text-center">
//         <p>© 2023 IntelliHire. All rights reserved.</p>
//         <Link to="/" className="text-primary">Back to Home</Link>
//       </footer>
//     </div>
//   );
// };

// export default QuizzesPage;


import React, { useState, useEffect } from 'react';
import { FaPlay, FaFilter } from 'react-icons/fa';
import { Link } from 'wouter';
import axios from 'axios';

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

  // 🔥 Fetch tests from backend
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/tests");
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
        <h1 className="text-4xl font-bold mb-4">Mock Tests & Quizzes</h1>
        <p className="text-lg">Select a test and simulate real exam experience</p>
      </header>

      {/* Filters */}
      <section className="flex justify-center items-center p-8 bg-gray-100 gap-4">
        <FaFilter className="text-2xl text-primary" />
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
          className="p-3 border rounded-lg"
        >
          <option value="all">All Tests</option>
        </select>
      </section>

      {/* Tests from DB */}
      <section className="p-16 bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {tests.length === 0 ? (
            <p className="text-center col-span-3">No tests available</p>
          ) : (
            tests.map((test) => (
              <div key={test._id} className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">

                <h3 className="text-xl font-semibold mb-2">{test.title}</h3>

                <p className="text-gray-600 mb-4">
                  {test.questions.length} Questions
                </p>

                <p className="text-sm mb-4">
                  ⏱ Duration: {test.questions.length} min
                </p>

                <Link to={`/quiz/${test._id}`}>
                  <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full flex items-center gap-2 mx-auto">
                    <FaPlay /> Start Test
                  </button>
                </Link>

              </div>
            ))
          )}

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center">
        <p>© 2023 IntelliHire. All rights reserved.</p>
        <Link to="/" className="text-primary">Back to Home</Link>
      </footer>
    </div>
  );
};

export default QuizzesPage;