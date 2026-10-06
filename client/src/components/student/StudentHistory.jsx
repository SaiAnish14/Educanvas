import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { getLocalHistory } from "../../utils/localStore";

const actionColors = {
  viewed: "bg-blue-100 text-blue-700",
  enrolled: "bg-emerald-100 text-emerald-700",
  downloaded: "bg-purple-100 text-purple-700",
};

const filters = ["all", "enrolled", "downloaded"];

export default function StudentHistory() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("all");
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
          collection(db, "studentHistory", currentUser.uid, "entries"),
          orderBy("timestamp", "desc")
        )
      );
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (docs.length > 0) {
        setEntries(docs);
      } else {
        setEntries(getLocalHistory("student", currentUser.uid));
      }
    } catch (err) {
      console.warn("Using localStore for StudentHistory:", err.message);
      setEntries(getLocalHistory("student", currentUser.uid));
    } finally {
      setLoading(false);
    }
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
        <p className="py-12 text-center text-slate-400">No history yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-slate-800">{entry.title}</p>
                <p className="text-xs text-slate-400">
                  {entry.timestamp?.toDate?.()?.toLocaleString() || "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${actionColors[entry.action]}`}>
                  {entry.action}
                </span>
                {entry.curriculumId && (
                  <Link
                    to={`/student/curriculum/${entry.curriculumId}`}
                    className="text-xs text-brand hover:text-brand-dark"
                  >
                    Go to Curriculum →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
