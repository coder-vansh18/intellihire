import React, { useEffect, useState } from 'react';
import { 
  FaLaptop, FaBrain, FaCode, FaBook, FaBuilding, FaCalendar, 
  FaMap, FaRocket, FaUser, FaBriefcase, FaEnvelope, FaFacebook, 
  FaTwitter, FaLinkedin, FaInstagram, FaGithub, FaPaperPlane,
  FaCheckCircle, FaArrowRight
} from 'react-icons/fa';
import { Link } from 'wouter';

const HomePage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [emailSub, setEmailSub] = useState("");
  const [subscribed, setSubscribed] = useState(false);

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

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (emailSub.trim()) {
      setSubscribed(true);
      setEmailSub("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-inter flex flex-col justify-between">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100">
        <div className="text-2xl font-black bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          <Link to="/">IntelliHire</Link>
        </div>
        
        <ul className="hidden md:flex items-center space-x-8 list-none font-medium text-sm text-gray-600">
          <li><Link to="/" className="hover:text-primary transition font-semibold text-primary">Home</Link></li>
          <li><Link to="/quizzes" className="hover:text-primary transition">Quizzes</Link></li>
          <li><Link to="/placements" className="hover:text-primary transition">Placements</Link></li>
          <li><Link to="/resources" className="hover:text-primary transition">Resources</Link></li>
          <li><Link to="/about" className="hover:text-primary transition">About</Link></li>
          {user && <li><Link to="/profile" className="hover:text-primary transition">Profile</Link></li>}
        </ul>

        {user ? (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-primary focus:outline-none transition"
              title={user.name || "Profile"}
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

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden py-1 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                </div>
                
                <Link to="/profile">
                  <div className="px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm font-medium cursor-pointer flex items-center gap-2">
                    <FaUser className="text-gray-400 text-xs" /> Profile
                  </div>
                </Link>

                <Link to={user.role === "company" || user.role === "professor" ? "/company-dashboard" : "/dashboard"}>
                  <div className="px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm font-medium cursor-pointer flex items-center gap-2">
                    <FaLaptop className="text-gray-400 text-xs" /> Dashboard
                  </div>
                </Link>

                <div
                  onClick={handleLogout}
                  className="px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm font-semibold cursor-pointer border-t border-gray-100 flex items-center gap-2"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">
            <button className="bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-md shadow-indigo-200 transition">
              Login / Signup
            </button>
          </Link>
        )}
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-8 md:px-16 py-16 md:py-20 bg-gradient-to-b from-white to-indigo-50/40">
        <div className="md:w-1/2 max-w-xl text-center md:text-left mb-10 md:mb-0">
          {user && (
            <div className="inline-flex items-center gap-2 bg-indigo-100/80 text-indigo-800 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4">
              <span>👋 Welcome back, {user.name}!</span>
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-5">
            Enhance Your Skills with <span className="text-primary">IntelliHire</span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed">
            Master coding tests, proctored assessments, and placement challenges with AI-powered analytics.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Link to="/quizzes">
              <button className="bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition flex items-center gap-2">
                Explore Assessments <FaArrowRight className="text-xs" />
              </button>
            </Link>
            <Link to="/placements">
              <button className="border-2 border-gray-300 hover:border-primary hover:text-primary text-gray-700 font-bold px-7 py-3.5 rounded-xl bg-white transition">
                Placement Portal
              </button>
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-md">
            <div className="absolute -top-4 -left-4 w-72 h-72 bg-indigo-300/30 rounded-full blur-3xl -z-10"></div>
            <img src="/assets/hero.svg" alt="Assessment Platform illustration" className="w-full max-w-md mx-auto drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Features Practice Categories */}
      <section className="py-16 px-6 md:px-12 bg-white text-center border-t border-gray-100">
        <h2 className="text-3xl font-black text-gray-900 mb-3">What do you want to practice?</h2>
        <p className="text-gray-500 text-sm mb-10 max-w-md mx-auto">Select a track to start practicing curated assessments tailored to campus drives.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          <Link to="/quizzes">
            <div className="bg-slate-50 hover:bg-indigo-50/50 p-6 rounded-2xl border border-gray-200/80 hover:border-indigo-300 text-center hover:shadow-xl transition duration-200 cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                <FaLaptop className="text-xl" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Coding Tests</h3>
              <p className="text-xs text-gray-500">Live code editor & logic</p>
            </div>
          </Link>
          
          <Link to="/quizzes">
            <div className="bg-slate-50 hover:bg-indigo-50/50 p-6 rounded-2xl border border-gray-200/80 hover:border-indigo-300 text-center hover:shadow-xl transition duration-200 cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                <FaBrain className="text-xl" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Aptitude Quizzes</h3>
              <p className="text-xs text-gray-500">Speed & quantitative</p>
            </div>
          </Link>

          <Link to="/quizzes">
            <div className="bg-slate-50 hover:bg-indigo-50/50 p-6 rounded-2xl border border-gray-200/80 hover:border-indigo-300 text-center hover:shadow-xl transition duration-200 cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                <FaCode className="text-xl" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">DSA Challenges</h3>
              <p className="text-xs text-gray-500">Trees, DP, Graphs</p>
            </div>
          </Link>

          <Link to="/resources">
            <div className="bg-slate-50 hover:bg-indigo-50/50 p-6 rounded-2xl border border-gray-200/80 hover:border-indigo-300 text-center hover:shadow-xl transition duration-200 cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                <FaBook className="text-xl" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Core Subjects</h3>
              <p className="text-xs text-gray-500">OS, DBMS, CN, OOPs</p>
            </div>
          </Link>

          <Link to="/placements">
            <div className="bg-slate-50 hover:bg-indigo-50/50 p-6 rounded-2xl border border-gray-200/80 hover:border-indigo-300 text-center hover:shadow-xl transition duration-200 cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                <FaBuilding className="text-xl" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Company Mock Tests</h3>
              <p className="text-xs text-gray-500">TCS, Infosys, Amazon</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Latest Content */}
      <section className="py-16 px-6 md:px-12 bg-slate-50 text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-3">Latest Assessment Streams</h2>
        <p className="text-gray-500 text-sm mb-10 max-w-md mx-auto">Updated regularly to match the latest recruitment patterns.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
          <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-primary flex items-center justify-center mb-4">
              <FaCode className="text-lg" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Latest Quizzes</h3>
            <p className="text-gray-600 text-sm mb-6">Practice recently assigned branch and section tests with proctoring.</p>
            <Link to="/quizzes">
              <button className="bg-primary hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition">
                View Quizzes
              </button>
            </Link>
          </div>

          <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <FaCalendar className="text-lg" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Placement Drives</h3>
            <p className="text-gray-600 text-sm mb-6">Mock recruitment rounds specifically customized for upcoming hiring drives.</p>
            <Link to="/placements">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition">
                View Drives
              </button>
            </Link>
          </div>

          <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <FaRocket className="text-lg" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Coding Sprints</h3>
            <p className="text-gray-600 text-sm mb-6">Tackle full-stack and algorithmic problems with instant compiler validation.</p>
            <Link to="/quizzes">
              <button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition">
                Start Sprint
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Learning Roadmaps */}
      <section className="py-16 px-6 md:px-12 bg-white text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-3">Placement Roadmaps</h2>
        <p className="text-gray-500 text-sm mb-10 max-w-md mx-auto">Structured step-by-step guides to prepare for campus and off-campus placements.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
          <div className="bg-slate-50 p-7 rounded-2xl border border-gray-200/80 hover:shadow-md transition">
            <FaBriefcase className="text-3xl text-primary mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Campus Prep Track</h3>
            <p className="text-gray-600 text-sm">Resume building, aptitude tests, technical rounds, and HR interviews.</p>
          </div>

          <div className="bg-slate-50 p-7 rounded-2xl border border-gray-200/80 hover:shadow-md transition">
            <FaCode className="text-3xl text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Full Stack Engineering</h3>
            <p className="text-gray-600 text-sm">Master React, Node.js, FastAPI, SQL, and system design patterns.</p>
          </div>

          <div className="bg-slate-50 p-7 rounded-2xl border border-gray-200/80 hover:shadow-md transition">
            <FaMap className="text-3xl text-purple-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">DSA & Problem Solving</h3>
            <p className="text-gray-600 text-sm">450+ curated DSA problems from basic arrays to advanced graphs.</p>
          </div>
        </div>
      </section>

      {/* 🔹 CTA: DISPLAY ONLY FOR GUEST / UN-AUTHENTICATED USERS */}
      {!user && (
        <section className="py-16 px-6 md:px-12 bg-gradient-to-b from-indigo-50/60 to-slate-100 text-center border-t border-indigo-100">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Join IntelliHire Today</h2>
          <p className="text-gray-600 text-sm mb-10 max-w-md mx-auto">Choose your role to access customized test libraries, proctoring tools, and analytics.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center mx-auto mb-4">
                <FaBuilding className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Company & Faculty Portal</h3>
              <p className="text-gray-600 text-sm mb-6">Create Excel-based assessments, assign by branch & year, and track results.</p>
              <Link to="/login">
                <button className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition">
                  Company Login →
                </button>
              </Link>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center mx-auto mb-4">
                <FaUser className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Student Portal</h3>
              <p className="text-gray-600 text-sm mb-6">Access assigned class tests, placement practice modules, and analytics.</p>
              <Link to="/login">
                <button className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white font-bold py-3 rounded-xl shadow-md transition">
                  Student Login →
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 🔹 FOOTER: MODERN, RESPONSIVE, STYLED */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="text-2xl font-black text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold shadow-md shadow-indigo-500/30">
                  IH
                </span>
                IntelliHire
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Empowering students and universities with AI-driven proctored assessments, branch-wise test distribution, and placement intelligence.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center space-x-3 pt-2">
                <a href="#facebook" aria-label="Facebook" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-primary text-slate-300 hover:text-white flex items-center justify-center transition shadow-sm">
                  <FaFacebook className="text-sm" />
                </a>
                <a href="#twitter" aria-label="Twitter" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-primary text-slate-300 hover:text-white flex items-center justify-center transition shadow-sm">
                  <FaTwitter className="text-sm" />
                </a>
                <a href="#linkedin" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-primary text-slate-300 hover:text-white flex items-center justify-center transition shadow-sm">
                  <FaLinkedin className="text-sm" />
                </a>
                <a href="#github" aria-label="GitHub" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-primary text-slate-300 hover:text-white flex items-center justify-center transition shadow-sm">
                  <FaGithub className="text-sm" />
                </a>
                <a href="#instagram" aria-label="Instagram" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-primary text-slate-300 hover:text-white flex items-center justify-center transition shadow-sm">
                  <FaInstagram className="text-sm" />
                </a>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm list-none p-0 m-0">
                <li><Link to="/" className="text-slate-400 hover:text-white transition">Home</Link></li>
                <li><Link to="/quizzes" className="text-slate-400 hover:text-white transition">Quizzes & Tests</Link></li>
                <li><Link to="/placements" className="text-slate-400 hover:text-white transition">Placements</Link></li>
                <li><Link to="/resources" className="text-slate-400 hover:text-white transition">Study Resources</Link></li>
                <li><Link to="/about" className="text-slate-400 hover:text-white transition">About Platform</Link></li>
              </ul>
            </div>

            {/* Col 3: For Educators & Students */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Features</h4>
              <ul className="space-y-2.5 text-sm list-none p-0 m-0">
                <li><Link to="/quizzes" className="text-slate-400 hover:text-white transition">AI Proctoring</Link></li>
                <li><Link to="/my-tests" className="text-slate-400 hover:text-white transition">Excel Assessment Creator</Link></li>
                <li><Link to="/student-results" className="text-slate-400 hover:text-white transition">Performance Analytics</Link></li>
                <li><Link to="/profile" className="text-slate-400 hover:text-white transition">Student Profile</Link></li>
              </ul>
            </div>

            {/* Col 4: Newsletter */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Stay Updated</h4>
              <p className="text-xs text-slate-400">Get notified about upcoming hackathons and placement tests.</p>
              
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={emailSub}
                    onChange={(e) => setEmailSub(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full bg-slate-800 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-primary placeholder-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <FaPaperPlane className="text-[10px]" /> Subscribe
                </button>
              </form>

              {subscribed && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-1">
                  <FaCheckCircle className="text-xs" /> Thank you for subscribing!
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} IntelliHire AI Platform. All rights reserved.</p>
            <div className="flex items-center space-x-6">
              <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-300 cursor-pointer">Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;