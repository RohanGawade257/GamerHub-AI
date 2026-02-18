import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Navbar from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import CreateGamePage from "../pages/CreateGamePage";
import DashboardPage from "../pages/DashboardPage";
import GameDetailsPage from "../pages/GameDetailsPage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";
import RegisterPage from "../pages/RegisterPage";
import ProtectedRoute from "../routes/ProtectedRoute";

function SportsApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div>
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/create-game" element={<CreateGamePage />} />
                  <Route path="/game/:id" element={<GameDetailsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default SportsApp;

