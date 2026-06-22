import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './Pages/Home'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Profile from './Pages/Profile'
import StudentDashboard from './Pages/StudentDashboard'
import CompanyDashboard from './Pages/CompanyDashboard'
import AdminDashboard from './Pages/AdminDashboard'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-grow-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Student Routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/studentdashboard"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                
                {/* Protected Company Route */}
                <Route
                  path="/companydashboard"
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <CompanyDashboard />
                    </ProtectedRoute>
                  }
                />
                
                {/* Protected Admin Route */}
                <Route
                  path="/admindashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <footer className="py-4 border-top bg-light text-center small text-muted mt-auto">
              <div className="container">
                &copy; {new Date().getFullYear()} HireHub Portal. All rights reserved.
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
