import { useState } from "react";
import { useLocation } from "react-router-dom";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { FileDown, Upload, Wand2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { generateCurriculum } from "../../utils/groqClient";
import { downloadCurriculumPDF } from "../../utils/generatePDF";
import { logTeacherAction } from "../../hooks/useFirestore";
import { saveLocalCurriculum } from "../../utils/localStore";
import CurriculumAccordion from "../shared/CurriculumAccordion";

const DEGREE_OPTIONS = [
  { value: "Diploma", label: "Diploma" },
  { value: "BTech", label: "Bachelor of Technology (B.Tech)" },
  { value: "Masters", label: "Master of Technology (M.Tech)" },
  { value: "Certification", label: "Professional Certification" },
];

const DURATION_OPTIONS = [
  { value: "2", label: "2 Semesters (1 Year)" },
  { value: "4", label: "4 Semesters (2 Years)" },
  { value: "6", label: "6 Semesters (3 Years)" },
  { value: "8", label: "8 Semesters (4 Years)" },
];

export default function GenerateCurriculum() {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const editData = location.state?.curriculum;

  const [form, setForm] = useState({
    skill: editData?.skill || "",
    level: editData?.level || "BTech",
    semesters: editData?.semesters?.toString() || "4",
    weeklyHours: editData?.weeklyHours || "",
    industryFocus: editData?.industryFocus || "",
  });
  const [curriculum, setCurriculum] = useState(
    editData
      ? {
          ...editData,
          semesters: editData.semesterData || editData.semesters,
        }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState(null);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setCurriculum(null);
    try {
      const { curriculum: generated } = await generateCurriculum({
        ...form,
        semesters: parseInt(form.semesters, 10),
      });
      setCurriculum(generated);
      await logTeacherAction(
        currentUser.uid,
        "generated",
        "",
        generated.title,
        generated
      );
    } catch (err) {
      showToast(err.response?.data?.error || "Generation failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    if (!curriculum) return;
    setPosting(true);
    try {
      const docData = {
        title: curriculum.title,
        skill: curriculum.skill,
        level: curriculum.level,
        semesters: parseInt(form.semesters, 10),
        weeklyHours: curriculum.weeklyHours || form.weeklyHours,
        industryFocus: curriculum.industryFocus || form.industryFocus,
        college: userProfile?.college || "Global University",
        teacherId: currentUser.uid,
        teacherName: userProfile?.name || "Faculty",
        postedAt: new Date().toISOString(),
        isPublished: true,
        status: "active",
        semesterData: curriculum.semesters,
        capstoneProject: curriculum.capstoneProject,
        downloadCount: editData?.downloadCount || 0,
      };

      let curriculumId = editData?.id || `curriculum-${Date.now()}`;
      docData.id = curriculumId;

      // Always save locally so it instantly appears in My Curricula and Browse
      saveLocalCurriculum(docData);
      await logTeacherAction(currentUser.uid, editData?.id ? "edited" : "posted", curriculumId, docData.title, docData);

      // Attempt to save to Firestore
      try {
        if (editData?.id) {
          await updateDoc(doc(db, "curricula", curriculumId), docData);
        } else {
          const ref = await addDoc(collection(db, "curricula"), docData);
          curriculumId = ref.id;
        }
      } catch (fsErr) {
        console.warn("Could not sync to Firestore (saved locally):", fsErr.message);
      }

      showToast("Curriculum posted successfully!");
    } catch (err) {
      showToast(err.message || "Failed to post", "error");
    } finally {
      setPosting(false);
    }
  }

  function handleDownload() {
    if (!curriculum) return;
    downloadCurriculumPDF(curriculum, userProfile.name, userProfile.college);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          AI Curriculum Generator 📚
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create new course syllabi structures using Groq AI LLM.
        </p>
      </div>

      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            toast.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleGenerate}
          className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 font-semibold text-slate-800">Syllabus Parameters 📋</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Degree Type
              </label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {DEGREE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Course Title / Specialization
              </label>
              <input
                name="skill"
                required
                value={form.skill}
                onChange={handleChange}
                placeholder="e.g. Artificial Intelligence & Data Science"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Program Duration
              </label>
              <select
                name="semesters"
                value={form.semesters}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {DURATION_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Industrial Skill Tags / Focus Areas
              </label>
              <input
                name="industryFocus"
                value={form.industryFocus}
                onChange={handleChange}
                placeholder="python, database systems, neural networks"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <p className="mt-1 text-xs text-slate-400">Separate multiple skills with commas.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Weekly Hours (optional)
              </label>
              <input
                name="weeklyHours"
                value={form.weeklyHours}
                onChange={handleChange}
                placeholder="20-25"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Generating…" : <>Generate Syllabus Map 🪄</>}
          </button>
        </form>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
              <span className="text-sm text-slate-500">Generating curriculum with AI…</span>
            </div>
          ) : curriculum ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">{curriculum.title}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <FileDown className="h-4 w-4" />
                    PDF
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={posting}
                    className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
              <CurriculumAccordion curriculum={curriculum} />
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50">
                <Wand2 className="h-7 w-7 text-brand" />
              </div>
              <p className="font-semibold text-slate-800">Ready for Input 🪄</p>
              <p className="mt-2 max-w-xs text-sm text-slate-500">
                Fill in the degree details on the left and trigger the generator. The AI engine
                will draft courses, credits, and syllabus bullet points.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
