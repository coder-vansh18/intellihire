import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { API_URL } from "../config";
import {
  FaCrown, FaUniversity, FaUserShield, FaChalkboardTeacher, 
  FaUserGraduate, FaClipboardList, FaPlus, FaTrashAlt, FaEdit, 
  FaGlobe, FaCheckCircle, FaTimes, FaSignOutAlt, FaSearch, FaUserPlus
} from "react-icons/fa";

const SuperAdminDashboard = () => {
  const [, setLocation] = useLocation();
  const [overview, setOverview] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [selectedOrgForAdmin, setSelectedOrgForAdmin] = useState(null);

  // Form State for Creating Org
  const [orgForm, setOrgForm] = useState({
    name: "",
    code: "",
    domain: "",
    admin_name: "",
    admin_email: "",
    admin_password: "adminpassword123"
  });

  // Form State for Assigning Org Admin
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "adminpassword123"
  });

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : ""
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [overviewRes, orgsRes] = await Promise.all([
        fetch(`${API_URL}/api/super-admin/overview`, { headers }),
        fetch(`${API_URL}/api/super-admin/organizations`, { headers })
      ]);

      if (overviewRes.status === 401 || overviewRes.status === 403) {
        showToast("Super Admin session expired or unauthorized", "error");
        setLocation("/login");
        return;
      }

      const [overviewData, orgsData] = await Promise.all([
        overviewRes.json(),
        orgsRes.json()
      ]);

      setOverview(overviewData);
      setOrganizations(Array.isArray(orgsData) ? orgsData : []);
    } catch (err) {
      console.error(err);
      showToast("Error loading Super Admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !storedUser || storedUser === "undefined") {
      setLocation("/login");
      return;
    }

    try {
      const u = JSON.parse(storedUser);
      if (u.role !== "super_admin") {
        if (u.role === "admin") setLocation("/admin-dashboard");
        else if (u.role === "company" || u.role === "professor") setLocation("/company-dashboard");
        else setLocation("/");
        return;
      }
    } catch {
      setLocation("/login");
      return;
    }

    fetchData();
  }, [setLocation]);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/super-admin/organizations`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(orgForm)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Organization '${data.name}' and Org Admin created! 🚀`);
        setShowCreateOrgModal(false);
        setOrgForm({
          name: "",
          code: "",
          domain: "",
          admin_name: "",
          admin_email: "",
          admin_password: "adminpassword123"
        });
        fetchData();
      } else {
        showToast(data.detail || "Failed to create organization", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error creating organization", "error");
    }
  };

  const handleAssignAdmin = async (e) => {
    e.preventDefault();
    if (!selectedOrgForAdmin) return;

    try {
      const res = await fetch(`${API_URL}/api/super-admin/organizations/${selectedOrgForAdmin.id}/admins`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(adminForm)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`New Org Admin assigned to ${selectedOrgForAdmin.name}! ✅`);
        setSelectedOrgForAdmin(null);
        setAdminForm({ name: "", email: "", password: "adminpassword123" });
        fetchData();
      } else {
        showToast(data.detail || "Failed to assign admin", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error assigning admin", "error");
    }
  };

  const handleDeleteOrg = async (org) => {
    if (!window.confirm(`Delete organization '${org.name}' (${org.code})? This will permanently delete all its admins, professors, students, and tests!`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/super-admin/organizations/${org.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Organization deleted successfully 🗑️");
        fetchData();
      } else {
        showToast(data.detail || "Failed to delete organization", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting organization", "error");
    }
  };

  const handleClearDemoData = async () => {
    if (!window.confirm("⚠️ ARE YOU SURE? This will permanently wipe all demo organizations, tests, and mock users from the database, leaving only your Super Admin account.")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/super-admin/clear-demo-data`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Database cleared successfully! 🧹", "success");
        fetchData();
      } else {
        showToast(data.detail || "Failed to clear database", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error communicating with server", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLocation("/login");
  };

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-inter flex flex-col justify-between">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300">
          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white ${
            toastMessage.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-slate-900/90 backdrop-blur-md shadow-2xl sticky top-0 z-20 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-xl text-white shadow-lg">
            <FaCrown className="text-xl" />
          </div>
          <div>
            <span className="text-xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              IntelliHire Master Control
            </span>
            <span className="ml-2 text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
              Super Admin Tier
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 flex-1">
        
        {/* KPI Platform Overview */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Organizations</span>
              <FaUniversity className="text-xl" />
            </div>
            <p className="text-3xl font-black text-white">{overview?.total_organizations ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Colleges & Institutions</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center text-indigo-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Org Admins</span>
              <FaUserShield className="text-xl" />
            </div>
            <p className="text-3xl font-black text-white">{overview?.total_org_admins ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Assigned Institutional Admins</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center text-purple-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
              <FaUserGraduate className="text-xl" />
            </div>
            <p className="text-3xl font-black text-white">{(overview?.total_students ?? 0) + (overview?.total_professors ?? 0)}</p>
            <p className="text-[11px] text-slate-400 mt-1">{overview?.total_students ?? 0} Students • {overview?.total_professors ?? 0} Faculty</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Assessments</span>
              <FaClipboardList className="text-xl" />
            </div>
            <p className="text-3xl font-black text-white">{overview?.total_tests ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">{overview?.total_submissions ?? 0} Submissions Recorded</p>
          </div>
        </section>

        {/* Organizations Management Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
          <div className="relative flex-1 max-w-md w-full">
            <FaSearch className="absolute left-3.5 top-3.5 text-slate-500 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organizations by name, code, domain..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleClearDemoData}
              className="bg-slate-800 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Wipe all demo organizations, tests, and mock users to start completely fresh"
            >
              <FaTrashAlt /> Clear Demo Data
            </button>

            <button
              onClick={() => setShowCreateOrgModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <FaPlus /> + Create New Organization
            </button>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Organization / Institution</th>
                  <th className="py-3.5 px-4">Allowed Domain</th>
                  <th className="py-3.5 px-4">Admins</th>
                  <th className="py-3.5 px-4">Professors</th>
                  <th className="py-3.5 px-4">Students</th>
                  <th className="py-3.5 px-4">Tests</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-500">Loading organizations...</td>
                  </tr>
                ) : filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-500">No organizations registered yet.</td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-white text-sm">{org.name}</p>
                          <span className="text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
                            Code: {org.code}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-max">
                          <FaGlobe className="text-[10px]" /> @{org.domain}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-200">{org.total_admins} Admin{org.total_admins > 1 ? "s" : ""}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-purple-400">{org.total_professors}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-400">{org.total_students}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-300">{org.total_tests}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrgForAdmin(org)}
                            className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                            title="Assign another Org Admin"
                          >
                            <FaUserPlus /> + Admin
                          </button>
                          <button
                            onClick={() => handleDeleteOrg(org)}
                            className="bg-rose-900/40 hover:bg-rose-600 text-rose-300 hover:text-white p-2 rounded-lg transition cursor-pointer"
                            title="Delete Organization"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* ---------------- MODAL 1: CREATE ORGANIZATION ---------------- */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaUniversity className="text-amber-400" /> Create New Organization & Assign Admin
              </h3>
              <button onClick={() => setShowCreateOrgModal(false)} className="text-slate-400 hover:text-white p-1">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] leading-relaxed">
                Creating an organization sets its institutional domain (e.g. <strong>skit.ac.in</strong>). All professors and students within this organization will only be provisioned with emails under this domain.
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">Organization / College Full Name *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    placeholder="e.g. Swami Keshvanand Institute of Technology (SKIT)"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Organization Code / Slug *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.code}
                    onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SKIT"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Allowed Email Domain *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.domain}
                    onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value.toLowerCase().replace("@", "") })}
                    placeholder="e.g. skit.ac.in"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-indigo-400 font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-800">
                  <h4 className="font-bold text-slate-200 mb-2">Initial Organization Administrator Credentials</h4>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.admin_name}
                    onChange={(e) => setOrgForm({ ...orgForm, admin_name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Sharma"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Admin Email Address *</label>
                  <input
                    type="email"
                    required
                    value={orgForm.admin_email}
                    onChange={(e) => setOrgForm({ ...orgForm, admin_email: e.target.value })}
                    placeholder="e.g. admin@skit.ac.in"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.admin_password}
                    onChange={(e) => setOrgForm({ ...orgForm, admin_password: e.target.value })}
                    placeholder="Temporary password"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl font-extrabold shadow-lg transition cursor-pointer"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: ASSIGN ADDITIONAL ORG ADMIN ---------------- */}
      {selectedOrgForAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaUserPlus className="text-indigo-400" /> Assign Admin for {selectedOrgForAdmin.name}
              </h3>
              <button onClick={() => setSelectedOrgForAdmin(null)} className="text-slate-400 hover:text-white p-1">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAssignAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g. Prof. Assistant Admin"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Admin Email Address *</label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder={`e.g. admin2@${selectedOrgForAdmin.domain}`}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Initial Password *</label>
                <input
                  type="text"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Temporary password"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrgForAdmin(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold shadow-lg transition cursor-pointer"
                >
                  Assign Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-slate-500 text-xs border-t border-slate-800">
        © 2026 IntelliHire AI Proctored Assessment Platform • Multi-Tenant Enterprise Tier
      </footer>
    </div>
  );
};

export default SuperAdminDashboard;
