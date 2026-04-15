// import { Link, useLocation } from 'wouter';
// import React, { useState } from 'react';
// import { FaUser, FaBuilding, FaEye, FaEyeSlash } from 'react-icons/fa';


// const LoginPage = () => {
//   const [, setLocation] = useLocation();
//   const [userType, setUserType] = useState('student');
//   const [formData, setFormData] = useState({ email: '', password: '' });
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState('');

//   const handleInputChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//   e.preventDefault();

//   if (!formData.email || !formData.password) {
//     setError('Please fill in all fields.');
//     return;
//   }

//   setError('');

//   try {
//     const res = await fetch("http://localhost:5000/api/auth/login", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         ...formData,
//         role: userType   // ✅ send role (student/company)
//       })
//     });

//     const data = await res.json();

//     // ❌ error handling
//     if (!res.ok) {
//       setError(data.message || "Login failed");
//       return;
//     }

//     if (!data.token) {
//       setError("Invalid response from server");
//       return;
//     }

//     // ✅ Save user with role
//     const userData = {
//       ...data.user,
//       role: userType
//     };

//     localStorage.setItem("token", data.token);
//     localStorage.setItem("user", JSON.stringify(userData));

//     // ✅ REDIRECT BASED ON ROLE
//     if (userType === "company") {
//       setLocation("/company-dashboard");
//     } else {
//       setLocation("/");
//     }

//   } catch (err) {
//     console.error(err);
//     setError("Server error");
//   }
// };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-primary to-secondary p-8 font-inter">
//       <div className="bg-white rounded-xl p-12 shadow-2xl w-full max-w-md text-center">
//         <h1 className="text-2xl font-bold text-gray-800 mb-8">Login to IntelliHire</h1>
//         <div className="flex mb-8 rounded-full overflow-hidden shadow-md">
//           <button
//             className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${userType === 'student' ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'bg-gray-100 text-gray-600'}`}
//             onClick={() => setUserType('student')}
//           >
//             <FaUser className="text-lg" /> Student
//           </button>
//           <button
//             className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${userType === 'company' ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'bg-gray-100 text-gray-600'}`}
//             onClick={() => setUserType('company')}
//           >
//             <FaBuilding className="text-lg" /> Company
//           </button>
//         </div>
//         <form onSubmit={handleSubmit} className="flex flex-col gap-6">
//           <div className="text-left">
//             <label className="block text-gray-700 font-medium mb-2">Email</label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleInputChange}
//               placeholder="Enter your email"
//               className="w-full p-3 border border-gray-300 rounded-lg"
//               required
//             />
//           </div>
//           <div className="text-left">
//             <label className="block text-gray-700 font-medium mb-2">Password</label>
//             <div className="relative">
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 name="password"
//                 value={formData.password}
//                 onChange={handleInputChange}
//                 placeholder="Enter your password"
//                 className="w-full p-3 border border-gray-300 rounded-lg"
//                 required
//               />
//               <button
//                 type="button"
//                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
//                 onClick={() => setShowPassword(!showPassword)}
//               >
//                 {showPassword ? <FaEyeSlash /> : <FaEye />}
//               </button>
//             </div>
//           </div>
//           {error && <p className="text-red-500 text-sm">{error}</p>}
//           <button type="submit" className="bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-full font-semibold hover:opacity-90 transition">
//             Login as {userType.charAt(0).toUpperCase() + userType.slice(1)}
//           </button>
//         </form>
//         <p className="mt-6 text-gray-600">
//           Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up here</Link>
//         </p>
//         <p className="mt-4">
//           <Link to="/" className="text-primary hover:underline">Back to Home</Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;





import { Link, useLocation } from 'wouter';
import React, { useState } from 'react';

const steps = ['Choose role', 'Sign in', 'Done'];

const LoginPage = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setUserType(role);
    setTimeout(() => setStep(2), 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('${API_URL}/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: userType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed'); setLoading(false); return; }
      if (!data.token) { setError('Invalid response from server'); setLoading(false); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...data.user, role: userType }));
      setStep(3);
      setTimeout(() => setLocation(userType === 'company' ? '/company-dashboard' : '/'), 1200);
    } catch (err) {
      console.error(err);
      setError('Server error');
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-primary to-secondary p-6 font-inter">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Stepper header */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-800">IntelliHire</span>
          </div>

          <div className="flex items-center gap-2">
            {steps.map((label, i) => {
              const idx = i + 1;
              const isDone = step > idx;
              const isActive = step === idx;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center border transition-all duration-300
                      ${isDone ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : isActive ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-400'}`}
                    >
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : idx}
                    </div>
                    <span className={`text-xs transition-colors ${isActive ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px mb-4 transition-colors duration-500 ${step > idx ? 'bg-indigo-300' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="px-8 pb-8">

          {/* Step 1 — Choose role */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Who are you?</h2>
              <p className="text-sm text-gray-500 mb-6">Select your account type to get started.</p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    key: 'student',
                    label: 'Student',
                    desc: 'Looking for internships or jobs',
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    ),
                  },
                  {
                    key: 'company',
                    label: 'Company',
                    desc: 'Hiring talent for your team',
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                      </svg>
                    ),
                  },
                ].map(({ key, label, desc, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleRoleSelect(key)}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200
                      ${userType === key
                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                      ${userType === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${userType === key ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                      {userType === key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Credentials */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0
                  ${userType === 'company' ? 'bg-indigo-600' : 'bg-indigo-600'}`}>
                  {userType === 'student' ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                    Sign in as {userType === 'student' ? 'Student' : 'Company'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    Change role
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Email address</label>
                  <input
                    type="email" name="email" value={formData.email}
                    onChange={handleInputChange} placeholder="you@example.com"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                    required autoFocus
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-gray-500">Password</label>
                    <Link to="/forgot-password" className="text-xs text-indigo-500 hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} name="password"
                      value={formData.password} onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="flex-none px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition disabled:opacity-60"
                  >
                    {loading ? 'Signing in...' : 'Continue'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3 — Success */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">You're in!</h2>
                <p className="text-sm text-gray-500 mt-1">Redirecting you to your dashboard…</p>
              </div>
              <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-[progress_1.2s_ease-in-out_forwards]" />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        {step < 3 && (
          <div className="border-t border-gray-100 px-8 py-4 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              No account yet?{' '}
              <Link to="/signup" className="text-indigo-600 font-medium hover:underline">Create one free</Link>
              {' · '}
              <Link to="/" className="text-gray-400 hover:underline">Back to home</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;