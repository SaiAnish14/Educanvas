import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { FileDown, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { downloadCurriculumPDF } from "../../utils/generatePDF";
import { getLocalCurricula } from "../../utils/localStore";

export default function Resources() {
  const { currentUser, userProfile } = useAuth();
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    async function load() {
      try {
        const snap = await getDocs(
          query(
            collection(db, "curricula"),
            where("teacherId", "==", currentUser.uid),
            where("isPublished", "==", true)
          )
        );
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (docs.length > 0) {
          setCurricula(docs);
        } else {
          setCurricula(getLocalCurricula({ teacherId: currentUser.uid, isPublished: true }));
        }
      } catch (err) {
        console.warn("Using localStore for Resources:", err.message);
        setCurricula(getLocalCurricula({ teacherId: currentUser.uid, isPublished: true }));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentUser]);

  function handleDownload(curriculum) {
    const pdfData = { ...curriculum, semesters: curriculum.semesterData };
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Resources 📁</h1>
        <p className="mt-1 text-sm text-slate-500">
          Download and share curriculum PDFs with your students.
        </p>
      </div>

      {curricula.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-white py-16 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-rose-50">
            <FileText className="h-7 w-7 text-rose-500" />
          </div>
          <p className="font-semibold text-slate-800">No Resources Yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Published curricula will appear here as downloadable PDF resources.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {curricula.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50">
                <FileText className="h-5 w-5 text-rose-500" />
              </div>
              <h3 className="font-semibold text-slate-800">{c.title}</h3>
              <p className="mt-1 text-xs text-slate-400">
                {c.level} · {c.semesters} semesters
              </p>
              <button
                onClick={() => handleDownload(c)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-brand py-2 text-sm font-medium text-brand transition hover:bg-[#EEF2FF]"
              >
                <FileDown className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
