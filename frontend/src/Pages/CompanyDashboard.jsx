import React, { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

function CompanyDashboard() {
  const { user } = useContext(AuthContext);

  const [postings, setPostings] = useState([]);
  const [activeTab, setActiveTab] = useState("manage"); // "manage" or "create"
  const [loading, setLoading] = useState(true);
  
  // Selection state for viewing applicants
  const [selectedPost, setSelectedPost] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Form state for creating a posting
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [stipend, setStipend] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const fetchPostings = async () => {
    setLoading(true);
    try {
      const response = await api.company.getInternships();
      if (response.data.success) {
        setPostings(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch company postings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostings();
  }, []);

  const handleCreatePosting = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setAlert({ type: "", message: "" });

    const skillList = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const response = await api.internship.create({
        title,
        description,
        skills_required: skillList,
        stipend,
        duration,
        deadline,
      });

      if (response.data.success) {
        setAlert({
          type: "success",
          message: "Internship posting created successfully!",
        });
        
        // Reset form fields
        setTitle("");
        setDescription("");
        setSkillsInput("");
        setStipend("");
        setDuration("");
        setDeadline("");
        
        // Reload postings
        await fetchPostings();
        
        // Switch to manage tab
        setTimeout(() => {
          setActiveTab("manage");
          setAlert({ type: "", message: "" });
        }, 1500);
      }
    } catch (err) {
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to create internship posting.",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewApplicants = async (post) => {
    setSelectedPost(post);
    setLoadingApplicants(true);
    setApplicants([]);
    setAlert({ type: "", message: "" });

    try {
      const response = await api.company.getApplicants(post._id);
      if (response.data.success) {
        setApplicants(response.data.data);
      }
    } catch (err) {
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to fetch applicants.",
      });
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const response = await api.company.updateApplicantStatus(appId, newStatus);
      if (response.data.success) {
        setAlert({
          type: "success",
          message: `Applicant has been successfully ${newStatus.toLowerCase()}!`,
        });
        
        // Update local applicants state directly
        setApplicants((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
        );
      }
    } catch (err) {
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to update status.",
      });
    }
  };

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold">Company Dashboard</h2>
        <p className="text-muted">Welcome back, {user?.name}. Manage your postings and screen applicants.</p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4 border-bottom-0 gap-2">
        <li className="nav-item">
          <button
            className={`nav-link fw-bold px-4 py-2.5 rounded-3 border-0 ${
              activeTab === "manage" ? "active bg-primary text-white shadow-sm" : "bg-light text-muted"
            }`}
            onClick={() => {
              setActiveTab("manage");
              setSelectedPost(null);
              setApplicants([]);
            }}
          >
            <i className="bi bi-list-task me-1"></i> Manage Postings
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-bold px-4 py-2.5 rounded-3 border-0 ${
              activeTab === "create" ? "active bg-primary text-white shadow-sm" : "bg-light text-muted"
            }`}
            onClick={() => setActiveTab("create")}
          >
            <i className="bi bi-plus-circle me-1"></i> Post Internship
          </button>
        </li>
      </ul>

      {/* Alert Block */}
      {alert.message && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show rounded-3 small mb-4`} role="alert">
          <i className="bi bi-info-circle-fill me-2"></i> {alert.message}
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === "manage" ? (
        <div className="row g-4">
          {/* Left Panel: List of Postings */}
          <div className={selectedPost ? "col-lg-5" : "col-12"}>
            <div className="card shadow-sm border-0 p-4 rounded-4 h-100">
              <h4 className="fw-bold mb-4">My Posted Internships</h4>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : postings.length === 0 ? (
                <div className="text-center py-5 bg-light border rounded-3">
                  <i className="bi bi-card-list text-muted fs-1"></i>
                  <h5 className="mt-3 fw-semibold text-secondary">No Postings Yet</h5>
                  <p className="text-muted small">You haven't posted any internships. Switch to the "Post Internship" tab to create one.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {postings.map((post) => {
                    const isSelected = selectedPost?._id === post._id;
                    return (
                      <div
                        key={post._id}
                        onClick={() => handleViewApplicants(post)}
                        className={`card border p-3 rounded-3 cursor-pointer transition-all ${
                          isSelected ? "border-primary bg-primary-subtle" : "card-hover"
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="fw-bold mb-1 text-primary">{post.title}</h6>
                          <span className={`badge ${post.status === "active" ? "bg-success" : "bg-secondary"}`}>
                            {post.status}
                          </span>
                        </div>
                        <p className="text-muted small mb-2 text-truncate">{post.description}</p>
                        <div className="d-flex justify-content-between align-items-center text-muted small mt-2">
                          <span>
                            <i className="bi bi-calendar-event me-1"></i> Deadline: {post.deadline}
                          </span>
                          <span className="fw-bold text-primary">
                            Click to View Applicants
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Selected Posting Applicants */}
          {selectedPost && (
            <div className="col-lg-7">
              <div className="card shadow-sm border-0 p-4 rounded-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0">Applicants for: <span className="text-primary">{selectedPost.title}</span></h4>
                  <button className="btn btn-sm btn-close" onClick={() => setSelectedPost(null)}></button>
                </div>

                {loadingApplicants ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="text-center py-5 bg-light border rounded-3">
                    <i className="bi bi-people text-muted fs-1"></i>
                    <h5 className="mt-3 fw-semibold text-secondary">No Applicants Found</h5>
                    <p className="text-muted small">No students have applied to this posting yet.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {applicants.map((app) => (
                      <div key={app.id} className="border p-4 rounded-3 bg-light shadow-2xs">
                        <div className="row g-3">
                          {/* Photo & Basic info */}
                          <div className="col-md-2 text-center">
                            {app.student.photo_path ? (
                              <img
                                src={`http://localhost:5000/${app.student.photo_path}`}
                                alt="Applicant"
                                className="rounded-circle border border-primary p-0.5"
                                style={{ width: "65px", height: "65px", objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold mx-auto"
                                style={{ width: "65px", height: "65px", fontSize: "1.5rem" }}
                              >
                                {app.student.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="col-md-10">
                            <h5 className="fw-bold mb-1">{app.student.name}</h5>
                            <p className="text-muted small mb-2"><i className="bi bi-envelope"></i> {app.student.email}</p>
                            
                            <h6 className="fw-bold text-secondary mb-1 small">Education:</h6>
                            <p className="text-muted small mb-2">{app.student.education || "No education background supplied."}</p>

                            <h6 className="fw-bold text-secondary mb-1 small">Skills:</h6>
                            <div className="d-flex flex-wrap gap-1.5 mb-3">
                              {app.student.skills && app.student.skills.length > 0 ? (
                                app.student.skills.map((skill) => (
                                  <span key={skill} className="badge bg-white text-dark text-capitalize border small">
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted small">None listed.</span>
                              )}
                            </div>

                            <div className="d-flex align-items-center justify-content-between border-top pt-3 flex-wrap gap-3">
                              {app.student.resume_path ? (
                                <a
                                  href={`http://localhost:5000/${app.student.resume_path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-outline-success btn-xs px-3 rounded-pill fw-semibold"
                                >
                                  <i className="bi bi-file-earmark-pdf"></i> Download Resume PDF
                                </a>
                              ) : (
                                <span className="text-warning small"><i className="bi bi-exclamation-triangle"></i> No resume</span>
                              )}

                              <div className="d-flex gap-2">
                                {app.status === "Pending" ? (
                                  <>
                                    <button
                                      className="btn btn-danger btn-xs px-3 rounded-pill fw-semibold"
                                      onClick={() => handleUpdateStatus(app.id, "Rejected")}
                                    >
                                      Reject
                                    </button>
                                    <button
                                      className="btn btn-success btn-xs px-3 rounded-pill fw-semibold"
                                      onClick={() => handleUpdateStatus(app.id, "Accepted")}
                                    >
                                      Accept
                                    </button>
                                  </>
                                ) : (
                                  <span className={`badge px-3 py-2 rounded-pill ${
                                    app.status === "Accepted" ? "bg-success" : "bg-danger"
                                  }`}>
                                    Decision: {app.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Create Posting Form */
        <div className="card shadow-sm border-0 p-4 rounded-4">
          <h4 className="fw-bold mb-4">Post a New Internship Opportunity</h4>
          <form onSubmit={handleCreatePosting}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Internship Title</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  placeholder="e.g. Frontend React Developer Intern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Job Description</label>
                <textarea
                  className="form-control rounded-3"
                  rows="5"
                  placeholder="Describe internship roles, projects, requirements, and office details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Skills Required (comma-separated)</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  placeholder="React, Node.js, Python, Git"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  required
                />
                <div className="form-text text-muted small">
                  Separate each skill with a comma. We will convert this into tags for search filtering.
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Stipend Details</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  placeholder="e.g. $1000 / month, Unpaid, Negotiable"
                  value={stipend}
                  onChange={(e) => setStipend(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Duration</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  placeholder="e.g. 3 Months, 6 Weeks"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Application Deadline</label>
                <input
                  type="date"
                  className="form-control rounded-3"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 pt-3">
                <button type="submit" className="btn btn-primary px-5 py-2.5 rounded-3 fw-bold" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Publishing posting...
                    </>
                  ) : (
                    "Publish Posting"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CompanyDashboard;
