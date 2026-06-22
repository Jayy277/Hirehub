import React, { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

function Profile() {
  const { user, refreshProfile } = useContext(AuthContext);

  const [education, setEducation] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState([]);
  
  const [resume, setResume] = useState(null);
  const [photo, setPhoto] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      setEducation(user.education || "");
      setSkills(user.skills || []);
      setSkillsInput((user.skills || []).join(", "));
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Split skills by comma and trim
    const skillList = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const response = await api.student.updateProfile(education, skillList);
      if (response.data.success) {
        setSkills(skillList);
        setMessage({ type: "success", text: "Profile details updated successfully." });
        await refreshProfile();
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resume) {
      setMessage({ type: "danger", text: "Please select a resume file first." });
      return;
    }

    // Frontend validation
    if (resume.type !== "application/pdf") {
      setMessage({ type: "danger", text: "Invalid file type. Only PDF resumes are accepted." });
      return;
    }

    if (resume.size > 5 * 1024 * 1024) {
      // 5MB
      setMessage({ type: "danger", text: "Resume file size exceeds the 5MB limit." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("resume", resume);

    try {
      const response = await api.student.uploadResume(formData);
      if (response.data.success) {
        setMessage({ type: "success", text: "Resume uploaded successfully!" });
        setResume(null);
        // Clear input file element
        document.getElementById("resumeFileInput").value = "";
        await refreshProfile();
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to upload resume.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photo) {
      setMessage({ type: "danger", text: "Please select a photo file first." });
      return;
    }

    // Frontend validation
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (!allowedTypes.includes(photo.type)) {
      setMessage({
        type: "danger",
        text: "Invalid file type. Only images (png, jpg, jpeg, gif) are accepted.",
      });
      return;
    }

    if (photo.size > 2 * 1024 * 1024) {
      // 2MB
      setMessage({ type: "danger", text: "Profile photo size exceeds the 2MB limit." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("photo", photo);

    try {
      const response = await api.student.uploadPhoto(formData);
      if (response.data.success) {
        setMessage({ type: "success", text: "Profile photo uploaded successfully!" });
        setPhoto(null);
        document.getElementById("photoFileInput").value = "";
        await refreshProfile();
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to upload photo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm("Are you sure you want to delete your profile photo?")) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.student.deletePhoto();
      if (response.data.success) {
        setMessage({ type: "success", text: "Profile photo deleted successfully." });
        await refreshProfile();
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to delete profile photo.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row g-4">
        {/* Left Column: Summary Card */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 p-4 text-center rounded-4 h-100">
            <h5 className="fw-bold mb-4 text-start">Profile Summary</h5>
            
            <div className="mb-4 position-relative d-inline-block mx-auto" style={{ width: "150px", height: "150px" }}>
              {user.photo_path ? (
                <>
                  <img
                    src={`http://localhost:5000/${user.photo_path}`}
                    alt="Profile Avatar"
                    className="rounded-circle border border-primary p-1 shadow-sm"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                  />
                  <button
                    onClick={handleDeletePhoto}
                    className="btn btn-danger btn-sm rounded-circle position-absolute d-flex align-items-center justify-content-center shadow-sm"
                    style={{ bottom: "5px", right: "5px", width: "32px", height: "32px", padding: 0 }}
                    title="Delete profile picture"
                    type="button"
                    disabled={loading}
                  >
                    <i className="bi bi-trash-fill fs-6"></i>
                  </button>
                </>
              ) : (
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold mx-auto shadow-sm"
                  style={{ width: "150px", height: "150px", fontSize: "3.5rem" }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : "S"}
                </div>
              )}
            </div>

            <h4 className="fw-bold mb-1">{user.name}</h4>
            <p className="text-muted small mb-3">{user.email}</p>
            
            {user.resume_path ? (
              <a
                href={`http://localhost:5000/${user.resume_path}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-success btn-sm w-100 py-2 rounded-pill fw-semibold mb-3"
              >
                <i className="bi bi-file-earmark-pdf-fill me-1"></i> View Resume PDF
              </a>
            ) : (
              <div className="alert alert-warning small py-2 rounded-pill mb-3">
                <i className="bi bi-exclamation-circle-fill me-1"></i> No resume uploaded yet.
              </div>
            )}

            {skills.length > 0 && (
              <div className="text-start border-top pt-3 mt-2">
                <h6 className="fw-bold text-muted mb-2">My Skills</h6>
                <div className="d-flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span key={idx} className="badge bg-primary-subtle text-primary border border-primary px-3 py-1.5 rounded-pill text-capitalize small">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Edit Profile & File Uploads */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-4 rounded-4 h-100">
            <h4 className="fw-bold mb-4">Manage Profile</h4>

            {message.text && (
              <div className={`alert alert-${message.type} alert-dismissible fade show rounded-3 small mb-4`} role="alert">
                <i className="bi bi-info-circle-fill me-2"></i> {message.text}
              </div>
            )}

            {/* Profile Info Form */}
            <form onSubmit={handleProfileUpdate} className="mb-5 border-bottom pb-4">
              <h5 className="fw-bold mb-3 text-muted">Update Information</h5>
              
              <div className="mb-3">
                <label htmlFor="educationInput" className="form-label fw-semibold">Education Background</label>
                <textarea
                  className="form-control rounded-3"
                  id="educationInput"
                  rows="3"
                  placeholder="e.g. B.S. in Computer Science at University of Maryland (Expected 2027)"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                ></textarea>
              </div>

              <div className="mb-4">
                <label htmlFor="skillsInput" className="form-label fw-semibold">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  id="skillsInput"
                  placeholder="React, JavaScript, Node.js, Python, MongoDB"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                />
                <div className="form-text text-muted small">
                  Separate each skill with a comma (e.g. HTML, CSS, JavaScript).
                </div>
              </div>

              <button type="submit" className="btn btn-primary px-4 rounded-pill" disabled={loading}>
                Save Changes
              </button>
            </form>

            <div className="row g-4">
              {/* Photo Upload Form */}
              <div className="col-md-6 border-end-md">
                <form onSubmit={handlePhotoUpload}>
                  <h5 className="fw-bold mb-2 text-muted">Profile Photo</h5>
                  <p className="text-muted small mb-3">Accepts PNG, JPG, JPEG, GIF (Max size: 2MB)</p>
                  
                  <div className="mb-3">
                    <input
                      type="file"
                      className="form-control rounded-3"
                      id="photoFileInput"
                      accept="image/*"
                      onChange={(e) => setPhoto(e.target.files[0])}
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-outline-primary btn-sm px-4 rounded-pill" disabled={loading}>
                    Upload Photo
                  </button>
                </form>
              </div>

              {/* Resume Upload Form */}
              <div className="col-md-6">
                <form onSubmit={handleResumeUpload}>
                  <h5 className="fw-bold mb-2 text-muted">Resume Upload</h5>
                  <p className="text-muted small mb-3">Accepts PDF files only (Max size: 5MB)</p>
                  
                  <div className="mb-3">
                    <input
                      type="file"
                      className="form-control rounded-3"
                      id="resumeFileInput"
                      accept=".pdf"
                      onChange={(e) => setResume(e.target.files[0])}
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-outline-success btn-sm px-4 rounded-pill" disabled={loading}>
                    Upload Resume PDF
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
