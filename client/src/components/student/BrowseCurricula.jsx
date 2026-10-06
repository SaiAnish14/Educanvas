import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { getLocalCurricula, getLocalEnrollmentList } from "../../utils/localStore";

export default function BrowseCurricula() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [curricula, setCurricula] = useState([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !userProfile) return;
    loadCurricula();
  }, [currentUser, userProfile]);

  async function loadCurricula() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, "curricula"),
          where("college", "==", userProfile?.college || "Global University"),
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
        const localItems = getLocalCurricula({ isPublished: true });
        setCurricula(localItems.map(c => ({ ...c, enrollmentCount: getLocalEnrollmentList(c.id).length })));
      }
    } catch (err) {
      console.warn("Using localStore for BrowseCurricula:", err.message);
      const localItems = getLocalCurricula({ isPublished: true });
      setCurricula(localItems.map(c => ({ ...c, enrollmentCount: getLocalEnrollmentList(c.id).length })));
    } finally {
      setLoading(false);
    }
  }

  const filtered = curricula.filter((c) => {
    const matchesSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.skill.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "all" || c.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Browse Curricula</h1>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or skill…"
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none min-w-[200px]"
        />
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          <option value="all">All Levels</option>
          {["Diploma", "BTech", "Masters", "Certification"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-slate-400">No curricula found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/student/curriculum/${c.id}`)}
              className="rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-800">{c.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{c.skill} · {c.level}</p>
              <p className="mt-1 text-xs text-slate-400">{c.semesters} semesters</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">By {c.teacherName}</span>
                <span className="flex items-center gap-1 text-xs text-brand">
                  <Users className="h-3 w-3" />
                  {c.enrollmentCount} enrolled
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
