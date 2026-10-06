import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Presentation,
  GraduationCap,
  Sparkles,
  FileDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AuthNavbar from "../auth/AuthNavbar";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description: "Create complete semester-wise curricula in seconds using Groq LLaMA models.",
  },
  {
    icon: GraduationCap,
    title: "College-Scoped Access",
    description: "Students only see curricula from their own institution — secure and private.",
  },
  {
    icon: FileDown,
    title: "Instant PDF Export",
    description: "Download professional curriculum PDFs with one click.",
  },
];

function WizardStepper({ step }) {
  return (
    <div className="wizard-stepper">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="wizard-step">
          <div
            className={`wizard-step-circle ${
              step === n ? "active" : step > n ? "completed" : "upcoming"
            }`}
          >
            {step > n ? <Check className="h-4 w-4" /> : n}
          </div>
          {i < 2 && <div className={`wizard-step-line ${step > n ? "completed" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

export default function CoverPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "teacher",
    college: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validateStep() {
    if (step === 1) return true;
    if (step === 2) {
      if (!form.name.trim() || !form.email.trim() || !form.password) {
        setError("Please fill in all fields.");
        return false;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    }
    if (step === 3 && !form.college.trim()) {
      setError("Please enter your university name.");
      return false;
    }
    return true;
  }

  function handleNext() {
    setError("");
    if (!validateStep()) return;
    if (step < 3) setStep((s) => s + 1);
  }

  function handleBack() {
    setError("");
    setStep((s) => s - 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validateStep()) return;
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        college: form.college,
      });
      navigate(form.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please go to Login or use another email.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Failed to register");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col font-sans">
      <AuthNavbar />

      {/* Main split content area */}
      <div className="flex-grow flex flex-col lg:flex-row">
        {/* Left Side: Brand Panel with beautiful gradient */}
        <section
          className="w-full lg:w-1/2 bg-gradient-to-br from-[#1e1b4b] via-[#2e1c8c] to-[#4f46e5] relative overflow-hidden flex flex-col justify-center px-8 py-16 md:py-24 lg:px-16 lg:py-0"
          aria-label="EduCanvas Intro"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Join EduCanvas Today
            </h1>
            <p className="mt-4 md:mt-6 text-sm md:text-base lg:text-lg text-indigo-100/80 leading-relaxed font-light">
              Generate and export syllabus tables in seconds, coordinate with classroom materials,
              and access AI help logs.
            </p>
          </div>
        </section>

        {/* Right Side: Registration Wizard Form */}
        <section
          className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 md:py-16 bg-[#F8F9FC]"
          aria-label="Registration Portal"
        >
          <div className="w-full max-w-md bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100">
            <div className="mb-4 text-center">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Create Account</h2>
              <p className="mt-1 text-xs md:text-sm text-slate-500">
                Follow the wizard steps to set up your account
              </p>
            </div>

            <WizardStepper step={step} />

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs md:text-sm text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <form
              onSubmit={step === 3 ? handleSubmit : (e) => {
                e.preventDefault();
                handleNext();
              }}
            >
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm md:text-base text-slate-800">
                      Step 1: Account Type
                    </h3>
                    <p className="mt-1 text-xs md:text-sm text-slate-500">Select your portal role:</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role: "teacher" }))}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 md:p-5 transition-all duration-200 ${
                        form.role === "teacher"
                          ? "border-brand bg-brand text-white shadow-md shadow-brand/20 scale-[1.02]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand/40"
                      }`}
                    >
                      <Presentation className="h-7 w-7 md:h-8 md:w-8" />
                      <span className="font-semibold text-xs md:text-sm">Faculty</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role: "student" }))}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 md:p-5 transition-all duration-200 ${
                        form.role === "student"
                          ? "border-brand bg-brand text-white shadow-md shadow-brand/20 scale-[1.02]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand/40"
                      }`}
                    >
                      <GraduationCap className="h-7 w-7 md:h-8 md:w-8" />
                      <span className="font-semibold text-xs md:text-sm">Student</span>
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-xs md:text-sm font-semibold text-white transition hover:bg-brand-dark shadow-sm"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm md:text-base text-slate-800">
                      Step 2: Personal Information
                    </h3>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs md:text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <input
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 md:py-2.5 text-xs md:text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs md:text-sm font-medium text-slate-700">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 md:py-2.5 text-xs md:text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      placeholder="john@domain.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs md:text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 md:py-2.5 text-xs md:text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs md:text-sm font-medium text-slate-700">
                      Confirm Password
                    </label>
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 md:py-2.5 text-xs md:text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 md:py-2.5 text-xs md:text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button
                      type="submit"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand py-2 md:py-2.5 text-xs md:text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm md:text-base text-slate-800">
                      Step 3: Academic Institution
                    </h3>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs md:text-sm font-medium text-slate-700">
                      University Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        name="college"
                        required
                        value={form.college}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 py-2 md:py-2.5 pl-10 pr-4 text-xs md:text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                        placeholder="e.g. IIT Bombay"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 md:py-2.5 text-xs md:text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent-teal py-2 md:py-2.5 text-xs md:text-sm font-semibold text-white hover:bg-teal-600 transition shadow-sm disabled:opacity-50"
                    >
                      {loading ? "Creating…" : <><Check className="h-4 w-4" /> Sign Up</>}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <p className="mt-6 text-center text-xs md:text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-brand hover:text-brand-dark hover:underline">
                Sign In here
              </Link>
            </p>
          </div>
        </section>
      </div>

      {/* Features Section */}
      <section
        id="features"
        className="bg-white border-t border-slate-100 py-20 px-6 scroll-mt-16"
        aria-label="Features"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              Transform Skills into Structured Learning Paths
            </h2>
            <p className="mt-3 text-sm md:text-base text-slate-500 max-w-lg mx-auto">
              Streamline your academic curriculum design with our powerful suite of tools.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group relative rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-brand/20"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF2FF] text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-800 transition-colors duration-300 group-hover:text-brand">
                  {title}
                </h3>
                <p className="mt-2 text-xs md:text-sm text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F8F9FC] border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        Powered by Groq API · Firebase · React · SmartBridge / Skill Wallet v1.0.0
      </footer>
    </div>
  );
}
