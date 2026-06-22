import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

function Navbar() {
  const { user, role, logout } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg border-bottom sticky-top shadow-sm" style={{ backdropFilter: "blur(10px)", backgroundColor: "var(--bs-body-bg)" }}>
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center fw-bold text-primary" to="/">
          <i className="bi bi-briefcase-fill me-2 fs-4"></i>
          HireHub
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            
            {/* Student Links */}
            {role === "student" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/studentdashboard">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">My Profile</Link>
                </li>
              </>
            )}

            {/* Company Links */}
            {role === "company" && (
              <li className="nav-item">
                <Link className="nav-link" to="/companydashboard">Company Space</Link>
              </li>
            )}

            {/* Admin Links */}
            {role === "admin" && (
              <li className="nav-item">
                <Link className="nav-link" to="/admindashboard">Admin Panel</Link>
              </li>
            )}
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              className="btn btn-outline-secondary border-0 d-flex align-items-center p-2 rounded-circle"
              onClick={toggleTheme}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <i className="bi bi-sun-fill text-warning fs-5"></i>
              ) : (
                <i className="bi bi-moon-stars-fill text-dark fs-5"></i>
              )}
            </button>

            {/* Auth Buttons */}
            {user ? (
              <div className="d-flex align-items-center gap-3">
                <span className="text-muted d-none d-md-inline small">
                  Logged in as <strong className="text-primary">{user.name}</strong> ({role})
                </span>
                
                {role === "student" && user.photo_path ? (
                  <img
                    src={`http://localhost:5000/${user.photo_path}`}
                    alt="Profile"
                    className="rounded-circle border border-primary"
                    style={{ width: "35px", height: "35px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: "35px", height: "35px", fontSize: "0.9rem" }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                
                <button className="btn btn-danger btn-sm px-3" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link className="btn btn-outline-primary btn-sm px-3" to="/login">
                  Login
                </Link>
                <Link className="btn btn-primary btn-sm px-3" to="/register">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;