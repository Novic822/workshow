import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import FriendPage from "./components/FriendPage";
import ToastContainer from "./components/ToastContainer";
import Landing from "./components/Landing";

function AppContent() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    // Routes: landing at /, auth at /auth, app pages under /app and /friends
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/app" element={user ? <Dashboard /> : <AuthForm />} />
            <Route path="/friends" element={user ? <FriendPage /> : <AuthForm />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
                <ToastContainer />
            </AuthProvider>
        </BrowserRouter>
    );
}
