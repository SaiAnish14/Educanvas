import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { Eye, RotateCcw, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { logTeacherAction } from "../../hooks/useFirestore";
import { getLocalHistory } from "../../utils/localStore";
import CurriculumAccordion from "../shared/CurriculumAccordion";

const actionColors = {
  generated: "bg-blue-100 text-blue-700",
  posted: "bg-emerald-100 text-emerald-700",
  edited: "bg-amber-100 text-amber-700",
  deleted: "bg-red-100 text-red-700",
};

const filters = ["all", "generated", "posted", "edited"];

export default function TeacherHistory() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    loadHistory();
  }, [currentUser]);

  async function loadHistory() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, "teacherHistory", currentUser.uid, "entries"),
          orderBy("timestamp", "desc")
        )
      );
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (docs.length > 0) {
        setEntries(docs);
      } else {
        setEntries(getLocalHistory("teacher", currentUser.uid));
      }
    } catch (err) {
      console.warn("Using localStore for TeacherHistory:", err.message);
      setEntries(getLocalHistory("teacher", currentUser.uid));
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(entry) {
    if (!entry.curriculumId || !entry.snapshot) return;
    if (!confirm(`Restore "${entry.title}" to this version?`)) return;

    const snapshot = entry.snapshot;
    await updateDoc(doc(db, "curricula", entry.curriculumId), {
      ...snapshot,
      isPublished: true,
    });
    await logTeacherAction(
      currentUser.uid,
      "edited",
      entry.curriculumId,
      entry.title,
      snapshot
    );
    setModal(null);
    loadHistory();
  }

  const filtered = filter === "all" ? entries : entries.filter((e) => e.action === filter);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">History</h1>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                filter === f ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-slate-400">No history entries yet.</p>
      ) : (
        <div className="relative space-y-0">
          {filtered.map((entry, i) => (
            <div key={entry.id} className="relative flex gap-4 pb-8">
              {i < filtered.length - 1 && (
                <div className="absolute left-[11px] top-6 h-full w-0.5 bg-slate-200" />
              )}
              <div className="relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-brand bg-white" />
              <div className="flex-1 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{entry.title}</p>
                    <p className="text-xs text-slate-400">
                      {entry.timestamp?.toDate?.()?.toLocaleString() || "—"}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${actionColors[entry.action]}`}>
                    {entry.action}
                  </span>
                </div>
                {entry.snapshot && (
                  <button
                    onClick={() => setModal(entry)}
                    className="mt-3 flex items-center gap-1 text-xs text-brand hover:text-brand-dark"
                  >
                    <Eye className="h-3 w-3" /> View Snapshot
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{modal.title}</h2>
              <button onClick={() => setModal(null)} className="rounded p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CurriculumAccordion curriculum={modal.snapshot} />
            {modal.curriculumId && (
              <button
                onClick={() => handleRestore(modal)}
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
              >
                <RotateCcw className="h-4 w-4" /> Restore this version
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
