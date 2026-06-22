import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

function Home() {
  const { user, role } = useContext(AuthContext);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);

  // Load internships
  const fetchInternships = async () => {
    setLoading(true);
    try {
      const response = await api.internship.list(search, selectedSkills);
      if (response.data.success) {
        setInternships(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching internships:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [selectedSkills]);

  // Extract all unique skills from internships for filtering
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

  const handleSkillToggle = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  return (
    <div className="container py-5">
      {/* Hero Section */}
      <div className="p-5 mb-5 rounded-4 shadow-sm bg-gradient-primary" style={{
        background: "linear-gradient(135deg, rgba(13,110,253,0.1) 0%, rgba(102,16,242,0.1) 100%)",
        border: "1px solid rgba(13,110,253,0.15)"
      }}>
        <div className="row align-items-center">
          <div className="col-lg-7">
            <h1 className="display-4 fw-bold mb-3 text-gradient">
              Find Your Dream Internship or Hire Elite Talent
            </h1>
            <p className="lead mb-4 text-muted">
              HireHub connects students looking for real-world experience with top-tier companies offering internships and freelance gigs. Simple, fast, and secure.
            </p>
            <div className="d-flex gap-3">
              {!user ? (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg px-4 shadow-sm">
                    Get Started <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                  <Link to="/login" className="btn btn-outline-primary btn-lg px-4">
                    Explore Internships
                  </Link>
                </>
              ) : (
                <>
                  {role === "student" && (
                    <Link to="/studentdashboard" className="btn btn-primary btn-lg px-4 shadow-sm">
                      Go to Dashboard
                    </Link>
                  )}
                  {role === "company" && (
                    <Link to="/companydashboard" className="btn btn-primary btn-lg px-4 shadow-sm">
                      Post an Internship
                    </Link>
                  )}
                  {role === "admin" && (
                    <Link to="/admindashboard" className="btn btn-primary btn-lg px-4 shadow-sm">
                      Admin Console
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="col-lg-5 d-none d-lg-block text-center">
            <i className="bi bi-rocket-takeoff-fill text-primary" style={{ fontSize: "12rem", opacity: 0.85 }}></i>
          </div>
        </div>
      </div>

      {/* Internships Search & Explore Section */}
      <div className="row g-4">
        {/* Sidebar Filters */}
        <div className="col-md-3">
          <div className="card shadow-sm border p-3 rounded-3 sticky-top" style={{ top: "90px" }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center">
              <i className="bi bi-funnel-fill text-primary me-2"></i> Filters
            </h5>
            
            <div className="mb-4">
              <label className="form-label fw-semibold">Filter by Skill Required</label>
              <div className="d-flex flex-wrap gap-2 mt-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                {availableSkills.length > 0 ? (
                  availableSkills.map((skill) => {
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
                  })
                ) : (
                  <span className="text-muted small">No skills found.</span>
                )}
              </div>
            </div>

            {selectedSkills.length > 0 && (
              <button
                className="btn btn-outline-danger btn-sm w-100 mt-2"
                onClick={() => setSelectedSkills([])}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Internship Postings */}
        <div className="col-md-9">
          {/* Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden border">
              <span className="input-group-text bg-transparent border-0 pe-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 ps-3 focus-ring-none"
                placeholder="Search internships by title or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-primary px-4 fw-semibold" type="submit">
                Search
              </button>
            </div>
          </form>

          {/* Internship Cards Grid */}
          <h4 className="fw-bold mb-4 d-flex align-items-center justify-content-between">
            <span>Available Postings ({internships.length})</span>
            {loading && (
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
          </h4>

          {internships.length === 0 ? (
            <div className="text-center py-5 border rounded-4 bg-light shadow-sm">
              <i className="bi bi-clipboard2-x text-muted" style={{ fontSize: "3rem" }}></i>
              <h5 className="mt-3 fw-semibold">No internships found</h5>
              <p className="text-muted">Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {internships.map((internship) => (
                <div key={internship._id} className="card shadow-sm border-0 border-start border-primary border-4 p-4 rounded-3 card-hover transition-all">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                      <h5 className="fw-bold mb-1 text-primary">{internship.title}</h5>
                      <h6 className="fw-semibold text-secondary mb-2">
                        <i className="bi bi-building me-1"></i> {internship.company_name}
                      </h6>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill">
                      Stipend: {internship.stipend}
                    </span>
                  </div>

                  <p className="text-muted text-break my-3" style={{ whiteSpace: "pre-line" }}>
                    {internship.description.length > 220
                      ? `${internship.description.substring(0, 220)}...`
                      : internship.description}
                  </p>

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {internship.skills_required.map((skill) => (
                      <span key={skill} className="badge bg-light text-dark text-capitalize px-3 py-2 border rounded-pill">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="d-flex justify-content-between align-items-center flex-wrap pt-3 border-top gap-3">
                    <div className="d-flex gap-4 text-muted small">
                      <span>
                        <i className="bi bi-calendar3 me-1"></i> Deadline: {internship.deadline}
                      </span>
                      <span>
                        <i className="bi bi-hourglass-split me-1"></i> Duration: {internship.duration}
                      </span>
                    </div>

                    {role === "student" ? (
                      <Link to="/studentdashboard" className="btn btn-primary btn-sm px-4 rounded-pill">
                        Apply Now
                      </Link>
                    ) : role === "company" || role === "admin" ? (
                      <span className="text-muted small">Access Dashboard to manage</span>
                    ) : (
                      <Link to="/login" className="btn btn-outline-primary btn-sm px-4 rounded-pill">
                        Login to Apply
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;