import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Register() {
  const { register, user, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("student"); // "student" or "company"
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user && role) {
      if (role === "student") navigate("/studentdashboard");
      else if (role === "company") navigate("/companydashboard");
      else if (role === "admin") navigate("/admindashboard");
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    const result = await register(name, email, password, selectedRole);
    setLoading(false);

    if (result.success) {
      setSuccess(result.message + " Redirecting to login...");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: "85vh" }}>
      <div className="card shadow border-0 p-4 rounded-4" style={{ maxWidth: "500px", width: "100%" }}>
        <div className="text-center mb-4">
          <i className="bi bi-person-plus-fill text-primary" style={{ fontSize: "3rem" }}></i>
          <h2 className="fw-bold mt-2">Create Account</h2>
          <p className="text-muted">Join HireHub to connect with opportunities</p>
        </div>

        {error && (
          <div className="alert alert-danger rounded-3 small" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success rounded-3 small" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i> {success}
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="row g-2 mb-4 bg-light p-1.5 rounded-3">
          <div className="col">
            <button
              type="button"
              className={`btn w-100 fw-bold py-2 rounded-2 ${
                selectedRole === "student" ? "btn-primary shadow-sm" : "btn-light text-muted border-0"
              }`}
              onClick={() => setSelectedRole("student")}
            >
              <i className="bi bi-mortarboard me-1"></i> Student
            </button>
          </div>
          <div className="col">
            <button
              type="button"
              className={`btn w-100 fw-bold py-2 rounded-2 ${
                selectedRole === "company" ? "btn-primary shadow-sm" : "btn-light text-muted border-0"
              }`}
              onClick={() => setSelectedRole("company")}
            >
              <i className="bi bi-building me-1"></i> Company
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-3">
            <label htmlFor="nameInput" className="form-label fw-semibold">
              {selectedRole === "student" ? "Full Name" : "Company Name"}
            </label>
            <div className="input-group border rounded-3 overflow-hidden">
              <span className="input-group-text bg-transparent border-0">
                <i className="bi bi-person text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 ps-2"
                id="nameInput"
                placeholder={selectedRole === "student" ? "John Doe" : "Acme Corp"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="emailInput" className="form-label fw-semibold">Email Address</label>
            <div className="input-group border rounded-3 overflow-hidden">
              <span className="input-group-text bg-transparent border-0">
                <i className="bi bi-envelope text-muted"></i>
              </span>
              <input
                type="email"
                className="form-control border-0 ps-2"
                id="emailInput"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="passwordInput" className="form-label fw-semibold">Password</label>
            <div className="input-group border rounded-3 overflow-hidden">
              <span className="input-group-text bg-transparent border-0">
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input
                type="password"
                className="form-control border-0 ps-2"
                id="passwordInput"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label htmlFor="confirmPasswordInput" className="form-label fw-semibold">Confirm Password</label>
            <div className="input-group border rounded-3 overflow-hidden">
              <span className="input-group-text bg-transparent border-0">
                <i className="bi bi-lock-fill text-muted"></i>
              </span>
              <input
                type="password"
                className="form-control border-0 ps-2"
                id="confirmPasswordInput"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm d-flex justify-content-center align-items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top">
          <p className="text-muted small mb-0">
            Already have an account? <Link to="/login" className="fw-semibold text-primary">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
