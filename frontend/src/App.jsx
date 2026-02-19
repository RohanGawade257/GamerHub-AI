import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AIWidget from "./components/AIWidget";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import CreateGame from "./pages/CreateGamePage";
import CommunityDetailsPage from "./pages/CommunityDetailsPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import Dashboard from "./pages/DashboardPage";
import GameDetails from "./pages/GameDetailsPage";
import JoinCommunityPage from "./pages/JoinCommunityPage";
import Login from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import PlayerProfilePage from "./pages/PlayerProfilePage";
import Profile from "./pages/ProfilePage";
import Register from "./pages/RegisterPage";
import ProtectedRoute from "./routes/ProtectedRoute";

function AuthenticatedLayout() {
  return (
    <div className="pt-[72px] md:pt-[80px]">
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 text-gray-900 dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950 dark:text-gray-100">
        <Navbar />

        <main className="mx-auto max-w-6xl px-4 pb-6">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<AuthenticatedLayout />}>
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              <Route path="/profile" element={<Profile />} />
              <Route path="/communities" element={<CommunitiesPage />} />
              <Route path="/join-community" element={<JoinCommunityPage />} />
              <Route path="/community/:id" element={<CommunityDetailsPage />} />
              <Route path="/player/:id" element={<PlayerProfilePage />} />
              <Route path="/create-game" element={<CreateGame />} />
              <Route path="/game/:id" element={<GameDetails />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <AIWidget apiUrl="https://gamerhub-ai.onrender.com/api/chat" />
      </div>
    </AuthProvider>
  );
}

export default App;
