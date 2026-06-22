import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If no token exists in localStorage, redirect to login
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If role isn't allowed, redirect to Home
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
