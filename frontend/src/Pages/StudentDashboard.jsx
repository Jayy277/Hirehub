import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

function StudentDashboard() {
  const { user } = useContext(AuthContext);
  
  const [applications, setApplications] = useState([]);
  const [internships, setInternships] = useState([]);
  
  const [search, setSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  
  const [alert, setAlert] = useState({ type: "", message: "" });

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const response = await api.student.getApplications();
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchInternships = async () => {
    setLoadingPosts(true);
    try {
      const response = await api.internship.list(search, selectedSkills);
      if (response.data.success) {
        setInternships(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load internships:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    fetchInternships();
  }, [selectedSkills]);

  // Load all unique skills for filter list
  useEffect(() => {
    const loadAllSkills = async () => {
      try {
        const response = await api.internship.list();
        if (response.data.success) {
          const list = response.data.data;
          const skillsSet = new Set();
          list.forEach((item) => {
            if (item.skills_required && Array.isArray(item.skills_required)) {
              item.skills_required.forEach((s) => skillsSet.add(s.toLowerCase()));
            }
          });
          setAvailableSkills(Array.from(skillsSet));
        }
      } catch (err) {
        console.error("Failed to load skills list:", err);
      }
    };
    loadAllSkills();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInternships();
  };

  const handleApply = async (id) => {
    setApplyingId(id);
    setAlert({ type: "", message: "" });
    
    try {
      const response = await api.internship.apply(id);
      if (response.data.success) {
        setAlert({
          type: "success",
          message: "Application submitted successfully! Check your inbox for confirmation.",
        });
        // Reload list of applications and internships
        await fetchApplications();
      }
    } catch (err) {
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to submit application.",
      });
    } finally {
      setApplyingId(null);
    }
  };

  const handleSkillToggle = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Accepted":
        return <span className="badge bg-success-subtle text-success border border-success px-3 py-1.5 rounded-pill fw-semibold">Accepted</span>;
      case "Rejected":
        return <span className="badge bg-danger-subtle text-danger border border-danger px-3 py-1.5 rounded-pill fw-semibold">Rejected</span>;
      default:
        return <span className="badge bg-warning-subtle text-warning border border-warning px-3 py-1.5 rounded-pill fw-semibold">Pending</span>;
    }
  };

  // Compute counters
  const totalApplied = applications.length;
  const pendingCount = applications.filter((app) => app.status === "Pending").length;
  const acceptedCount = applications.filter((app) => app.status === "Accepted").length;

  return (
    <div className="container py-5">
      {/* Header Info */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold">Student Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, {user?.name}. Apply to internships and track your results.</p>
        </div>
        <Link to="/profile" className="btn btn-outline-primary rounded-pill">
          <i className="bi bi-person-fill-gear me-1"></i> Edit Profile
        </Link>
      </div>

      {/* Resume Missing Alert */}
      {user && !user.resume_path && (
        <div className="alert alert-warning border border-warning rounded-4 p-4 mb-4 shadow-sm" role="alert">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h5 className="alert-heading fw-bold mb-1">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> Resume Missing
              </h5>
              <p className="mb-0 text-muted small">
                You haven't uploaded a resume PDF yet. Companies require a resume to review your profile. You won't be able to apply until you upload it.
              </p>
            </div>
            <Link to="/profile" className="btn btn-warning rounded-pill px-4 fw-semibold shrink-0">
              Upload Resume
            </Link>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row g-3 mb-5">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-primary text-white">
            <h6 className="fw-semibold text-white-50 uppercase small">Applied Postings</h6>
            <h2 className="fw-bold mb-0 mt-1">{totalApplied}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-warning text-dark">
            <h6 className="fw-semibold text-dark-50 uppercase small">Pending Decisions</h6>
            <h2 className="fw-bold mb-0 mt-1">{pendingCount}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-success text-white">
            <h6 className="fw-semibold text-white-50 uppercase small">Accepted Offers</h6>
            <h2 className="fw-bold mb-0 mt-1">{acceptedCount}</h2>
          </div>
        </div>
      </div>

      {/* Applications Tracking Section */}
      <div className="card shadow-sm border-0 p-4 rounded-4 mb-5">
        <h4 className="fw-bold mb-4">My Applications History</h4>
        
        {loadingApps ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-3">
            <i className="bi bi-inboxes text-muted fs-1"></i>
            <h5 className="mt-3 fw-semibold text-secondary">No Applications Found</h5>
            <p className="text-muted small">You haven't submitted any applications yet. Browse the opportunities below!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="ps-3">Internship Title</th>
                  <th scope="col">Company</th>
                  <th scope="col">Stipend</th>
                  <th scope="col">Applied Date</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="ps-3 fw-bold text-primary">{app.internship.title}</td>
                    <td className="fw-semibold text-secondary">{app.internship.company_name}</td>
                    <td><span className="badge bg-light text-dark border">{app.internship.stipend}</span></td>
                    <td className="small text-muted">{new Date(app.applied_at).toLocaleDateString()}</td>
                    <td>{getStatusBadge(app.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Explore Section */}
      <div className="row g-4 border-top pt-5">
        <div className="col-12">
          <h4 className="fw-bold mb-4">Browse and Apply</h4>
          
          {alert.message && (
            <div className={`alert alert-${alert.type} alert-dismissible fade show rounded-3 small mb-4`} role="alert">
              <i className="bi bi-info-circle-fill me-2"></i> {alert.message}
            </div>
          )}
        </div>

        {/* Sidebar Filters */}
        <div className="col-lg-3">
          <div className="card shadow-sm border p-3 rounded-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center">
              <i className="bi bi-funnel-fill text-primary me-2"></i> Filters
            </h5>
            
            <div className="mb-4">
              <label className="form-label fw-semibold">Filter by Skill</label>
              <div className="d-flex flex-wrap gap-2 mt-2" style={{ maxHeight: "180px", overflowY: "auto" }}>
                {availableSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`btn btn-sm text-capitalize rounded-pill ${
                        isSelected ? "btn-primary" : "btn-outline-secondary"
                      }`}
                    >
                      {skill} {isSelected && <i className="bi bi-x-circle-fill ms-1"></i>}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedSkills.length > 0 && (
              <button className="btn btn-outline-danger btn-sm w-100" onClick={() => setSelectedSkills([])}>
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Postings List */}
        <div className="col-lg-9">
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="input-group shadow-sm border rounded-3 overflow-hidden">
              <span className="input-group-text bg-transparent border-0 pe-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 ps-3 py-2.5"
                placeholder="Search internships..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-primary px-4 fw-semibold" type="submit">
                Search
              </button>
            </div>
          </form>

          {loadingPosts ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : internships.length === 0 ? (
            <div className="text-center py-4 bg-light border rounded-3">
              <span className="text-muted">No matching internships found.</span>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {internships.map((post) => {
                const alreadyApplied = applications.some((app) => app.internship_id === post._id);
                return (
                  <div key={post._id} className="card shadow-sm border p-4 rounded-4">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                      <div>
                        <h5 className="fw-bold mb-1">{post.title}</h5>
                        <h6 className="fw-semibold text-primary mb-2">
                          <i className="bi bi-building me-1"></i> {post.company_name}
                        </h6>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success px-3 py-1.5 rounded-pill">
                        {post.stipend}
                      </span>
                    </div>

                    <p className="text-muted text-break my-3" style={{ whiteSpace: "pre-line" }}>
                      {post.description}
                    </p>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {post.skills_required.map((skill) => (
                        <span key={skill} className="badge bg-light text-dark text-capitalize px-3 py-1.5 border rounded-pill small">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="d-flex justify-content-between align-items-center flex-wrap pt-3 border-top gap-3">
                      <div className="d-flex gap-3 text-muted small">
                        <span>
                          <i className="bi bi-calendar3 me-1"></i> Deadline: {post.deadline}
                        </span>
                        <span>
                          <i className="bi bi-hourglass-split me-1"></i> Duration: {post.duration}
                        </span>
                      </div>

                      {alreadyApplied ? (
                        <button className="btn btn-outline-secondary btn-sm px-4 rounded-pill" disabled>
                          <i className="bi bi-check-circle-fill me-1"></i> Applied
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm px-4 rounded-pill"
                          onClick={() => handleApply(post._id)}
                          disabled={applyingId === post._id || !user?.resume_path}
                          title={!user?.resume_path ? "Please upload your resume to apply" : ""}
                        >
                          {applyingId === post._id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                              Applying...
                            </>
                          ) : (
                            "Apply"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
