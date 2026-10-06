import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { FileDown, Pencil, Trash2, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { downloadCurriculumPDF } from "../../utils/generatePDF";
import { logTeacherAction } from "../../hooks/useFirestore";
import { getLocalCurricula, updateLocalCurriculum, getLocalEnrollmentList } from "../../utils/localStore";
import StudentProgressPanel from "./StudentProgressPanel";

export default function PostedCurricula() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    loadCurricula();
  }, [currentUser]);

  async function loadCurricula() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, "curricula"),
          where("teacherId", "==", currentUser.uid),
          where("isPublished", "==", true)
        )
      );

      const items = await Promise.all(
        snap.docs.map(async (d) => {
          const data = { id: d.id, ...d.data() };
          let enrollmentCount = 0;
          try {
            const enrollSnap = await getDocs(
              collection(db, "enrollments", d.id, "students")
            );
            enrollmentCount = enrollSnap.size;
          } catch {
            enrollmentCount = getLocalEnrollmentList(d.id).length;
          }
          return { ...data, enrollmentCount };
        })
      );

      if (items.length > 0) {
        setCurricula(items);
      } else {
        const localItems = getLocalCurricula({ teacherId: currentUser.uid, isPublished: true });
        setCurricula(localItems.map(c => ({ ...c, enrollmentCount: getLocalEnrollmentList(c.id).length })));
      }
    } catch (err) {
      console.warn("Could not load from Firestore, using localStore for PostedCurricula:", err.message);
      const localItems = getLocalCurricula({ teacherId: currentUser.uid, isPublished: true });
      setCurricula(localItems.map(c => ({ ...c, enrollmentCount: getLocalEnrollmentList(c.id).length })));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(curriculum) {
    if (!confirm(`Unpublish "${curriculum.title}"?`)) return;
    updateLocalCurriculum(curriculum.id, { isPublished: false });
    try {
      await updateDoc(doc(db, "curricula", curriculum.id), { isPublished: false });
    } catch {}
    await logTeacherAction(
      currentUser.uid,
      "deleted",
      curriculum.id,
      curriculum.title,
      curriculum
    );
    loadCurricula();
  }

  function handleEdit(curriculum) {
    navigate("/teacher/generate", { state: { curriculum } });
  }

  function handleDownload(curriculum) {
    const pdfData = {
      ...curriculum,
      semesters: curriculum.semesterData,
    };
    downloadCurriculumPDF(pdfData, userProfile.name, userProfile.college);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Curricula</h1>

      {curricula.length === 0 ? (
        <p className="py-12 text-center text-slate-400">No curricula posted yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {curricula.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{c.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {c.semesters} semesters · {c.level}
                  </p>
                  <p className="text-xs text-slate-400">
                    Posted {c.postedAt?.toDate?.()?.toLocaleDateString() || "—"}
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 py-1 text-xs font-medium text-brand">
                  <Users className="h-3 w-3" />
                  {c.enrollmentCount}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => handleDownload(c)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                >
                  <FileDown className="h-3 w-3" /> PDF
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
              <StudentProgressPanel curriculum={c} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
