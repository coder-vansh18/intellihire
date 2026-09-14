import { Link, useLocation } from 'wouter';
import React, { useState } from 'react';
import { API_URL } from "../config";
import ForgotPasswordModal from "./ForgotPasswordModal";

const steps = ['Choose role', 'Sign in', 'Done'];

const LoginPage = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

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
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: userType }),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMsg = typeof data.detail === 'string' ? data.detail : (data.message || 'Invalid email or password');
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      if (!data.token) {
        setError('Invalid response from server');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...data.user, role: userType || data.user.role }));
      setStep(3);
      
      setTimeout(() => {
        const effectiveRole = data.user.role || userType;
        if (effectiveRole === 'super_admin') {
          setLocation('/super-admin-dashboard');
        } else if (effectiveRole === 'admin') {
          setLocation('/admin-dashboard');
        } else if (effectiveRole === 'company' || effectiveRole === 'professor') {
          setLocation('/company-dashboard');
        } else {
          setLocation('/');
        }
      }, 1200);
    } catch (err) {
      console.error("Login fetch error:", err);
      setError('Connection failed. Please check backend server status.');
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
                    desc: 'Looking for internships, placement tests & practice assessments',
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    ),
                  },
                  {
                    key: 'company',
                    label: 'College Professor / Recruiter',
                    desc: 'Create and assign tests, oversee student submissions',
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                      </svg>
                    ),
                  },
                  {
                    key: 'admin',
                    label: 'Organization Admin',
                    desc: 'Manage college faculty, student domain accounts & assessments',
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                      </svg>
                    ),
                  },
                  {
                    key: 'super_admin',
                    label: 'Platform Super Admin',
                    desc: 'Manage institutions, onboard colleges & provision organization admins',
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10h2v4h-2zm0 5h2v2h-2z"/>
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
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                  {userType === 'super_admin' ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10h2v4h-2zm0 5h2v2h-2z"/>
                    </svg>
                  ) : userType === 'admin' ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                    </svg>
                  ) : userType === 'student' ? (
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
                    Sign in as {userType === 'super_admin' ? 'Super Admin' : userType === 'admin' ? 'Organization Admin' : userType === 'company' || userType === 'professor' ? 'Professor / Recruiter' : 'Student'}
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
                    onChange={handleInputChange} placeholder="e.g. b241187@skit.ac.in"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                    required autoFocus
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-gray-500">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-indigo-500 hover:underline font-medium"
                    >
                      Forgot / Reset Password?
                    </button>
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
              <span className="font-semibold text-gray-700">Institutional Access Only:</span> Contact your college administrator for your official credentials.
              {' · '}
              <Link to="/" className="text-indigo-600 hover:underline">Back to home</Link>
            </p>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotModal} 
        onClose={() => setShowForgotModal(false)} 
      />
    </div>
  );
};

export default LoginPage;