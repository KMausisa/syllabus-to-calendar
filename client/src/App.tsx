import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";

// Import components
import Login from "./components/Login/Login";
import DashBoard from "./components/Dashboard/Dashboard";
import Policy from "./components/Policy/Policy";

import "./App.css";

const API_BASE: string =
  import.meta.env.MODE === "production"
    ? "https://syllabus-to-calendar-yjkk.onrender.com"
    : import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  // Check session on mount
  useEffect(() => {
    // Check the user login status
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/session`, {
          credentials: "include",
        });
        const data = await response.json();
        setLoggedIn(data.loggedIn);
      } catch (error) {
        console.log("Error in validating user session: ", error);
        setLoggedIn(false);
      }
    };

    checkStatus();
  }, []);

  if (loggedIn === null) return <div className="loading">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            loggedIn ? (
              <DashBoard url={API_BASE} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            loggedIn ? <Navigate to="/" replace /> : <Login url={API_BASE} />
          }
        />
        <Route path="/policy" element={<Policy />} />
      </Routes>
    </Router>
  );
}
