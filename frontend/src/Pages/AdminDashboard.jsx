import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [internships, setInternships] = useState([]);

  const [activeTab, setActiveTab] = useState("overview"); // "overview", "students", "companies", "internships"
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  
  // Search parameters
  const [studentSearch, setStudentSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [internshipSearch, setInternshipSearch] = useState("");

  // Editing state for internship review
  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  const loadAllData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.admin.getStats();
      const studentsRes = await api.admin.getStudents();
      const companiesRes = await api.admin.getCompanies();
      const internshipsRes = await api.admin.getInternships();

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (studentsRes.data.success) setStudents(studentsRes.data.data);
      if (companiesRes.data.success) setCompanies(companiesRes.data.data);
      if (internshipsRes.data.success) setInternships(internshipsRes.data.data);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
      setAlert({
        type: "danger",
        message: "Failed to connect to administrative API. Check if backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Student operations
  const handleToggleStudent = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const res = await api.admin.toggleStudentStatus(id, newStatus);
      if (res.data.success) {
        setStudents((prev) =>
          prev.map((s) => (s._id === id ? { ...s, is_active: newStatus } : s))
        );
        setAlert({
          type: "success",
          message: `Student account status updated to ${newStatus ? "Active" : "Deactive"}.`,
        });
      }
    } catch (err) {
      setAlert({ type: "danger", message: "Failed to change student status." });
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this student account and their applications?")) return;
    try {
      const res = await api.admin.deleteStudent(id);
      if (res.data.success) {
        setStudents((prev) => prev.filter((s) => s._id !== id));
        setAlert({ type: "success", message: "Student account deleted." });
        // Refresh counts
        const statsRes = await api.admin.getStats();
        if (statsRes.data.success) setStats(statsRes.data.data);
      }
    } catch (err) {
      setAlert({ type: "danger", message: "Failed to delete student account." });
    }
  };

  // Company operations
  const handleToggleCompany = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const res = await api.admin.toggleCompanyStatus(id, newStatus);
      if (res.data.success) {
        setCompanies((prev) =>
          prev.map((c) => (c._id === id ? { ...c, is_active: newStatus } : c))
        );
        setAlert({
          type: "success",
          message: `Company account status updated to ${newStatus ? "Active" : "Deactive"}.`,
        });
      }
    } catch (err) {
      setAlert({ type: "danger", message: "Failed to change company status." });
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("Are you sure? Deleting this company will cascade delete all their posted internships and applications!")) return;
    try {
      const res = await api.admin.deleteCompany(id);
      if (res.data.success) {
        setCompanies((prev) => prev.filter((c) => c._id !== id));
        setAlert({ type: "success", message: "Company and all associated records deleted." });
        loadAllData();
      }
    } catch (err) {
      setAlert({ type: "danger", message: "Failed to delete company." });
    }
  };

  // Internship operations
  const handleDeleteInternship = async (id) => {
    if (!window.confirm("Delete this internship post?")) return;
    try {
      const res = await api.admin.deleteInternship(id);
      if (res.data.success) {
        setInternships((prev) => prev.filter((i) => i._id !== id));
        setAlert({ type: "success", message: "Internship post removed." });
        const statsRes = await api.admin.getStats();
        if (statsRes.data.success) setStats(statsRes.data.data);
      }
    } catch (err) {
      setAlert({ type: "danger", message: "Failed to delete internship posting." });
    }
  };

  const startEditInternship = (post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditDesc(post.description);
    setEditStatus(post.status);
  };

  const handleModifyInternship = async (e) => {
    e.preventDefault();
    try {
      const res = await api.admin.modifyInternship(editingPost._id, {
        title: editTitle,
        description: editDesc,
        status: editStatus,
      });
      if (res.data.success) {
        setInternships((prev) =>
          prev.map((i) =>
            i._id === editingPost._id
              ? { ...i, title: editTitle, description: editDesc, status: editStatus }
              : i
          )
        );
        setAlert({ type: "success", message: "Internship posting updated successfully." });
        setEditingPost(null);
      }
    } catch (err) {
      setAlert({ type: "danger", message: "Failed to modify internship posting." });
    }
  };

  // Filters for lists
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.email.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredInternships = internships.filter(
    (i) =>
      i.title.toLowerCase().includes(internshipSearch.toLowerCase()) ||
      i.company_name.toLowerCase().includes(internshipSearch.toLowerCase())
  );

  // Setup Recharts Data
  const chartData = stats
    ? [
        { name: "Pending", count: stats.applications_status.Pending, color: "#ffc107" },
        { name: "Accepted", count: stats.applications_status.Accepted, color: "#198754" },
        { name: "Rejected", count: stats.applications_status.Rejected, color: "#dc3545" },
      ]
    : [];

  return (
    <div className="container py-5">
      {/* Title */}
      <div className="mb-4">
        <h2 className="fw-bold">Admin Operations Control</h2>
        <p className="text-muted">Monitor database stats, activate/deactivate accounts, and moderate posts.</p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4 border-bottom-0 gap-2">
        {["overview", "students", "companies", "internships"].map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link fw-bold px-4 py-2.5 rounded-3 border-0 text-capitalize ${
                activeTab === tab ? "active bg-primary text-white shadow-sm" : "bg-light text-muted"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>

      {/* Alert */}
      {alert.message && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show rounded-3 small mb-4`} role="alert">
          <i className="bi bi-info-circle-fill me-2"></i> {alert.message}
          <button type="button" className="btn-close btn-sm" onClick={() => setAlert({ type: "", message: "" })}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        /* Tab Contents */
        <div>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && stats && (
            <div className="row g-4">
              {/* Cards row */}
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="card shadow-sm border p-4 rounded-4 text-center">
                      <h6 className="fw-bold text-muted small">Total Students</h6>
                      <h2 className="fw-bold text-primary mb-0">{stats.total_students}</h2>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card shadow-sm border p-4 rounded-4 text-center">
                      <h6 className="fw-bold text-muted small">Total Companies</h6>
                      <h2 className="fw-bold text-primary mb-0">{stats.total_companies}</h2>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card shadow-sm border p-4 rounded-4 text-center">
                      <h6 className="fw-bold text-muted small">Total Internships</h6>
                      <h2 className="fw-bold text-primary mb-0">{stats.total_internships}</h2>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card shadow-sm border p-4 rounded-4 text-center">
                      <h6 className="fw-bold text-muted small">Total Applications</h6>
                      <h2 className="fw-bold text-primary mb-0">{stats.total_applications}</h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="col-12 mt-4">
                <div className="card shadow-sm border-0 p-4 rounded-4">
                  <h4 className="fw-bold mb-4">Applications by Status Analytics</h4>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#888888" />
                        <YAxis allowDecimals={false} stroke="#888888" />
                        <Tooltip cursor={{ fill: "transparent" }} />
                        <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <div className="card shadow-sm border-0 p-4 rounded-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h4 className="fw-bold mb-0">Manage Students</h4>
                <input
                  type="text"
                  className="form-control rounded-3"
                  style={{ maxWidth: "300px" }}
                  placeholder="Search students by name/email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              <div className="table-responsive">
                <table className="table align-middle table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Name</th>
                      <th>Email</th>
                      <th>Date Registered</th>
                      <th>Status</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s._id}>
                        <td className="ps-3 fw-bold">{s.name}</td>
                        <td>{s.email}</td>
                        <td className="small text-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${s.is_active ? "bg-success" : "bg-danger"}`}>
                            {s.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-end pe-3">
                          <button
                            className={`btn btn-xs rounded-pill me-2 ${
                              s.is_active ? "btn-outline-warning" : "btn-outline-success"
                            }`}
                            onClick={() => handleToggleStudent(s._id, s.is_active)}
                          >
                            {s.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="btn btn-outline-danger btn-xs rounded-pill"
                            onClick={() => handleDeleteStudent(s._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMPANIES TAB */}
          {activeTab === "companies" && (
            <div className="card shadow-sm border-0 p-4 rounded-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h4 className="fw-bold mb-0">Manage Companies</h4>
                <input
                  type="text"
                  className="form-control rounded-3"
                  style={{ maxWidth: "300px" }}
                  placeholder="Search companies by name..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                />
              </div>

              <div className="table-responsive">
                <table className="table align-middle table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Company Name</th>
                      <th>Email</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map((c) => (
                      <tr key={c._id}>
                        <td className="ps-3 fw-bold">{c.name}</td>
                        <td>{c.email}</td>
                        <td className="text-truncate small text-muted" style={{ maxWidth: "150px" }}>
                          {c.description || "N/A"}
                        </td>
                        <td>
                          <span className={`badge ${c.is_active ? "bg-success" : "bg-danger"}`}>
                            {c.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-end pe-3">
                          <button
                            className={`btn btn-xs rounded-pill me-2 ${
                              c.is_active ? "btn-outline-warning" : "btn-outline-success"
                            }`}
                            onClick={() => handleToggleCompany(c._id, c.is_active)}
                          >
                            {c.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="btn btn-outline-danger btn-xs rounded-pill"
                            onClick={() => handleDeleteCompany(c._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INTERNSHIPS TAB */}
          {activeTab === "internships" && (
            <div className="card shadow-sm border-0 p-4 rounded-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h4 className="fw-bold mb-0">Manage Internship Postings</h4>
                <input
                  type="text"
                  className="form-control rounded-3"
                  style={{ maxWidth: "300px" }}
                  placeholder="Search postings/companies..."
                  value={internshipSearch}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyUp={(e) => setInternshipSearch(e.target.value)}
                />
              </div>

              {editingPost ? (
                /* Edit Internship mini form */
                <form onSubmit={handleModifyInternship} className="bg-light p-4 rounded-4 border mb-4">
                  <h5 className="fw-bold text-primary mb-3">Edit Posting</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Title</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Status</label>
                      <select
                        className="form-select rounded-3"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Description</label>
                      <textarea
                        className="form-control rounded-3"
                        rows="3"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        required
                      ></textarea>
                    </div>
                    <div className="col-12 gap-2 d-flex">
                      <button type="submit" className="btn btn-primary btn-sm px-4 rounded-pill">
                        Save Changes
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-4 rounded-pill"
                        onClick={() => setEditingPost(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : null}

              <div className="table-responsive">
                <table className="table align-middle table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Internship</th>
                      <th>Company</th>
                      <th>Stipend</th>
                      <th>Status</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInternships.map((i) => (
                      <tr key={i._id}>
                        <td className="ps-3 fw-bold">{i.title}</td>
                        <td className="fw-semibold text-secondary">{i.company_name}</td>
                        <td>{i.stipend}</td>
                        <td>
                          <span className={`badge ${i.status === "active" ? "bg-success" : "bg-secondary"}`}>
                            {i.status}
                          </span>
                        </td>
                        <td className="text-end pe-3">
                          <button
                            className="btn btn-outline-primary btn-xs rounded-pill me-2"
                            onClick={() => startEditInternship(i)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-danger btn-xs rounded-pill"
                            onClick={() => handleDeleteInternship(i._id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
