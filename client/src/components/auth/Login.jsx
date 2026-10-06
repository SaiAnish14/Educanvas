import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoginCover from "./LoginCover";
import AuthNavbar from "./AuthNavbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { profile } = await login(email, password, role);
      const targetRole = profile?.role || role;
      navigate(targetRole === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Invalid email or password. Please verify your credentials or register a new account.");
      } else {
        setError(err.message || "Failed to login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthNavbar />
      <div className="auth-page-body">
        <LoginCover />
        <div className="auth-form-panel">
          <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
              <p className="mt-1 text-sm text-slate-500">Sign in to EduCanvas</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                    role === "teacher"
                      ? "bg-white text-brand shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Faculty / Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                    role === "student"
                      ? "bg-white text-brand shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Student
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="you@college.edu"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark shadow-sm hover:shadow disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-medium text-brand hover:text-brand-dark">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
