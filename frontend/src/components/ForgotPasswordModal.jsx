import React, { useState } from "react";
import { API_URL } from "../config";
import { FaKey, FaEnvelope, FaLock, FaTimes, FaCheck, FaExclamationTriangle, FaShieldAlt } from "react-icons/fa";

const ForgotPasswordModal = ({ isOpen, onClose, defaultEmail = "" }) => {
  const [step, setStep] = useState(1); // 1 = Request Token, 2 = Enter Token & New Password
  const [email, setEmail] = useState(defaultEmail);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  if (!isOpen) return null;

  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setFeedback({ type: "error", text: "Please enter your registered institutional email address." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: "success",
          text: data.message
        });
        if (data.reset_token) {
          setResetToken(data.reset_token);
        }
        setStep(2);
      } else {
        setFeedback({ type: "error", text: data.detail || "Account not found with this email." });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Failed to connect to authentication server." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword.trim()) {
      setFeedback({ type: "error", text: "Please provide both reset token and new password." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          token: resetToken.trim(),
          new_password: newPassword.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", text: data.message });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setFeedback({ type: "error", text: data.detail || "Failed to reset password." });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Server error while resetting password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 text-slate-100 font-inter">
        
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
              <FaKey />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reset Institutional Password</h3>
              <p className="text-[11px] text-slate-400">Change temporary initial password to a private password</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <FaTimes />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "error"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
          }`}>
            {feedback.type === "error" ? <FaExclamationTriangle className="shrink-0" /> : <FaCheck className="shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Step 1: Request Token Form */}
        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">Institutional Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. b241187@skit.ac.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter your provisioned college domain email.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold shadow-lg transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Generating..." : "Generate Reset Token"}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Enter Token & Set New Password */
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Verification / Reset Token</label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="e.g. RESET-3A9F"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-indigo-400 font-mono font-bold tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">New Private Password</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold shadow-lg transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Updating..." : "Set New Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
