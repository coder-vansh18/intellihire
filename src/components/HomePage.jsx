import React, { useEffect, useState } from 'react';
import { FaLaptop, FaBrain, FaCode, FaBook, FaBuilding, FaCalendar, FaMap, FaRocket, FaUser, FaBriefcase, FaEnvelope, FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';
import { Link } from 'wouter';

const HomePage = () => {

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [user, setUser] = useState(null);

useEffect(() => {
  const storedUser = localStorage.getItem("user");

  if (storedUser && storedUser !== "undefined") {
    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error("Invalid user data:", err);
      localStorage.removeItem("user");
    }
  }
}, []);

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-10">
        <div className="text-2xl font-bold text-primary">
          <Link to="/">IntelliHire</Link>
        </div>
        <ul className="flex space-x-8 list-none">
          <li><Link to="/" className="text-gray-700 hover:text-primary">Home</Link></li>
          <li><Link to="/quizzes" className="text-gray-700 hover:text-primary">Quizzes</Link></li>
          <li><Link to="/placements" className="text-gray-700 hover:text-primary">Placements</Link></li>
          <li><Link to="/resources" className="text-gray-700 hover:text-primary">Resources</Link></li>
          <li><Link to="/about" className="text-gray-700 hover:text-primary">About</Link></li>
          <li><Link to="/profile" className="text-gray-700 hover:text-primary">Profile</Link></li>
        </ul>
        {user ? (
  <div className="relative">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setDropdownOpen(!dropdownOpen);
      }}
      className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full"
    >
      👤 {user.name}
    </button>

    {dropdownOpen && (
      <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden">
        
        <Link to="/profile">
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
            Profile
          </div>
        </Link>

        <Link to="/dashboard">
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
            Dashboard
          </div>
        </Link>

        <div
          onClick={handleLogout}
          className="px-4 py-2 hover:bg-red-100 text-red-500 cursor-pointer"
        >
          Logout
        </div>

      </div>
    )}
  </div>
) : (
  <Link to="/login">
    <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">
      Login / Signup
    </button>
  </Link>
)}

      </nav>

      {/* Hero */}
      <section className="flex flex-col md:flex-row items-center justify-center p-16 bg-white text-center md:text-left">
        <div className="md:w-1/2">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Enhance Your Skills with IntelliHire</h1>
          <p className="text-lg mb-6">Master coding tests, quizzes, and placements with our interactive platform.</p>
          <div className="flex space-x-4">
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full">Get Started</button>
            <Link to="/quizzes">
              <button className="border-2 border-primary text-primary px-6 py-3 rounded-full">Explore Quizzes</button>
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0">
          <img src="/assets/hero.svg" alt="Coding illustration" className="w-full max-w-md mx-auto drop-shadow-xl" />
        </div>
      </section>

      {/* Features */}
      <section className="p-16 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-8">What do you want to practice?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaLaptop className="text-4xl text-primary mb-4 mx-auto" />
            <h3 className="text-xl font-semibold">Coding Tests</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaBrain className="text-4xl text-primary mb-4 mx-auto" />
            <h3 className="text-xl font-semibold">Aptitude Quizzes</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaCode className="text-4xl text-primary mb-4 mx-auto" />
            <h3 className="text-xl font-semibold">DSA</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaBook className="text-4xl text-primary mb-4 mx-auto" />
            <h3 className="text-xl font-semibold">Core Subjects</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaBuilding className="text-4xl text-primary mb-4 mx-auto" />
            <h3 className="text-xl font-semibold">Company Placement Tests</h3>
          </div>
        </div>
      </section>

      {/* Latest Content */}
      <section className="p-16 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-8">Latest Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaCode className="text-4xl text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Latest Quizzes</h3>
            <p className="text-gray-600 mb-4">Practice the newest coding challenges.</p>
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">View Quizzes</button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaCalendar className="text-4xl text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upcoming Placement Tests</h3>
            <p className="text-gray-600 mb-4">Get ready for top company interviews.</p>
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">View Tests</button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaRocket className="text-4xl text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Recently Added Challenges</h3>
            <p className="text-gray-600 mb-4">Tackle fresh coding problems.</p>
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">Start Challenges</button>
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="p-16 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-8">Live Contests & Upcoming Quizzes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-2">Live Coding Contest</h3>
            <p className="text-gray-600 mb-4">Join now and compete with peers!</p>
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">Join Now</button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-2">Upcoming Aptitude Quiz</h3>
            <p className="text-gray-600 mb-4">Scheduled for next week. Register early!</p>
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">Register</button>
          </div>
        </div>
      </section>

      {/* Roadmaps */}
      <section className="p-16 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-8">Learning Roadmaps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaBriefcase className="text-4xl text-primary mb-4" />
            <h3 className="text-xl font-semibold">Placement Preparation</h3>
            <p className="text-gray-600">Step-by-step guide to ace interviews.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaCode className="text-4xl text-primary mb-4" />
            <h3 className="text-xl font-semibold">Web Development</h3>
            <p className="text-gray-600">From basics to advanced frameworks.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaMap className="text-4xl text-primary mb-4" />
            <h3 className="text-xl font-semibold">Data Structures & Algorithms</h3>
            <p className="text-gray-600">Master the fundamentals of DSA.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="p-16 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-8">Are you a Company or a Student?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaBuilding className="text-4xl text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Company Login</h3>
            <p className="text-gray-600 mb-4">Post jobs and assess candidates.</p>
            {!user && (
              <Link to="/login">
              <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">
              Login
              </button>
              </Link>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
            <FaUser className="text-4xl text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Student Login</h3>
            <p className="text-gray-600 mb-4">Access quizzes and placements.</p>
            {!user && (
              <Link to="/login">
              <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">
              Login
              </button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Subscribe to our Newsletter</h3>
            <FaEnvelope className="text-primary mb-2" />
            <input type="email" placeholder="Enter your email" className="p-2 rounded mr-2" />
            <button className="bg-primary px-4 py-2 rounded">Subscribe</button>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <ul className="list-none">
              <li><Link to="/" className="text-primary hover:underline">Home</Link></li>
              <li><Link to="/quizzes" className="text-primary hover:underline">Quizzes</Link></li>
              <li><Link to="/placements" className="text-primary hover:underline">Placements</Link></li>
              <li><Link to="/resources" className="text-primary hover:underline">Resources</Link></li>
              <li><Link to="/about" className="text-primary hover:underline">About</Link></li>
              <li><Link to="/profile" className="text-primary hover:underline">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Follow Us</h3>
            <div className="flex justify-center space-x-4">
              <FaFacebook className="text-primary text-xl cursor-pointer" />
              <FaTwitter className="text-primary text-xl cursor-pointer" />
              <FaLinkedin className="text-primary text-xl cursor-pointer" />
              <FaInstagram className="text-primary text-xl cursor-pointer" /> 
            </div>
          </div>
        </div>
        <p>© 2023 IntelliHire. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;