import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { FaUserCircle, FaPlusCircle, FaClipboardList, FaChartBar } from "react-icons/fa";

const CompanyDashboard = () => {

  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [, setLocation] = useLocation();


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setLocation("/login");
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">

      {/* 🔹 NAVBAR (Same as HomePage) */}
      <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-10">
        
        <div className="text-2xl font-bold text-primary">
          <Link to="/">IntelliHire</Link>
        </div>

        <ul className="flex space-x-8 list-none">
          <li><Link to="/company-dashboard" className="hover:text-primary">Home</Link></li>
          {/* <li><Link to="/quizzes" className="hover:text-primary">Quizzes</Link></li>
          <li><Link to="/placements" className="hover:text-primary">Placements</Link></li> */}
        </ul>

        {/* Auth Section */}
        {/* {user ? (
          <span className="font-semibold text-primary">🏢 {user.name}</span>
        ) : (
          <Link to="/login">
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">
              Login / Signup
            </button>
          </Link>
        )} */}

      <div className="relative">
        {user ? (
          <>
          <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 text-gray-700"
      >
        <FaUserCircle className="text-2xl" />
        <span className="font-medium">{user.name}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg p-2">
          
          <Link to="/profile">
            <p className="p-2 hover:bg-gray-100 cursor-pointer">
              Profile
            </p>
          </Link>

          <p
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 cursor-pointer text-red-500"
          >
            Logout
          </p>

        </div>
      )}
    </>
  ) : (
    <Link to="/login">
      <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">
        Login / Signup
      </button>
    </Link>
  )}
</div>
      </nav>

      {/* 🔹 HEADER */}
      <header className="text-center p-16 bg-white shadow-md">
        <h1 className="text-4xl font-bold mb-4">
          Welcome {user?.name || "Company"} 🏢
        </h1>
        <p className="text-lg">
          Manage your placement tests and track student performance
        </p>
      </header>

      {/* 🔹 DASHBOARD CARDS */}
      <section className="p-16 bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

          {/* Create Test */}
          <Link to="/create-test">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl hover:scale-105 transition duration-300 cursor-pointer">
              <FaPlusCircle className="text-5xl text-primary mb-4 mx-auto" />
              <h2 className="text-xl font-semibold mb-2">Create Test</h2>
              <p className="text-gray-600">Upload a new placement quiz</p>
            </div>
          </Link>

          {/* My Tests */}
          <Link to="/my-tests">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl hover:scale-105 transition duration-300 cursor-pointer">
              <FaClipboardList className="text-5xl text-primary mb-4 mx-auto" />
              <h2 className="text-xl font-semibold mb-2">My Tests</h2>
              <p className="text-gray-600">Manage your created tests</p>
            </div>
          </Link>

          {/* Results */}
          <Link to="/results">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl hover:scale-105 transition duration-300 cursor-pointer">
              <FaChartBar className="text-5xl text-primary mb-4 mx-auto" />
              <h2 className="text-xl font-semibold mb-2">Student Results</h2>
              <p className="text-gray-600">View performance analytics</p>
            </div>
          </Link>

        </div>
      </section>

      {/* 🔹 FOOTER (Same as HomePage) */}
      <footer className="bg-gray-800 text-white p-8 text-center">
        <p>© 2026 IntelliHire. All rights reserved.</p>
        <p className="mt-4">
          <Link to="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </p>
      </footer>

    </div>
  );
};

export default CompanyDashboard;