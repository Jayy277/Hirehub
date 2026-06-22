import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const { login, user, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If user is already logged in, redirect them immediately to their dashboard
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
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.role === "student") navigate("/studentdashboard");
      else if (result.role === "company") navigate("/companydashboard");
      else if (result.role === "admin") navigate("/admindashboard");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <div className="card shadow border-0 p-4 rounded-4" style={{ maxWidth: "450px", width: "100%" }}>
        <div className="text-center mb-4">
          <i className="bi bi-briefcase-fill text-primary" style={{ fontSize: "3rem" }}></i>
          <h2 className="fw-bold mt-2">Welcome Back</h2>
          <p className="text-muted">Log in to manage your HireHub account</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show rounded-3 small" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Address */}
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
          <div className="mb-4">
            <label htmlFor="passwordInput" className="form-label fw-semibold">Password</label>
            <div className="input-group border rounded-3 overflow-hidden">
              <span className="input-group-text bg-transparent border-0">
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input
                type="password"
                className="form-control border-0 ps-2"
                id="passwordInput"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm d-flex justify-content-center align-items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top">
          <p className="text-muted small mb-0">
            Don't have an account? <Link to="/register" className="fw-semibold text-primary">Register here</Link>
          </p>
        </div>
        
        {/* Seed Info note for developers */}
        <div className="bg-light border rounded-3 p-3 mt-3 text-center small text-muted">
          <strong>Demo Admin:</strong> admin@hirehub.com / AdminPass123!
        </div>
      </div>
    </div>
  );
}

export default Login;