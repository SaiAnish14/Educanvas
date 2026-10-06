import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import {
  Library,
  CheckCircle,
  Download,
  Users,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import StatCard from "../shared/StatCard";
import { getActiveCurriculaCount, getStudentCount } from "../../utils/statsApi";

export default function StudentDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState({ enrolled: 0, downloaded: 0 });
  const [studentCount, setStudentCount] = useState({ value: null, loading: true, error: null });
  const [activeCurricula, setActiveCurricula] = useState({ value: null, loading: true, error: null });
  const [recentViewed, setRecentViewed] = useState([]);

  const loadLiveStats = useCallback(async () => {
    if (!userProfile?.college) return;

    setStudentCount((s) => ({ ...s, loading: true, error: null }));
    setActiveCurricula((s) => ({ ...s, loading: true, error: null }));

    const [students, curricula] = await Promise.all([
      getStudentCount(userProfile.college),
      getActiveCurriculaCount(userProfile.college),
    ]);

    setStudentCount({ value: students.value, loading: false, error: students.error });
    setActiveCurricula({ value: curricula.value, loading: false, error: curricula.error });
  }, [userProfile?.college]);

  useEffect(() => {
    if (!currentUser || !userProfile) return;

    async function load() {
      try {
        const curriculaSnap = await getDocs(
          query(
            collection(db, "curricula"),
            where("college", "==", userProfile.college),
            where("isPublished", "==", true)
          )
        );

        let enrolled = 0;
        for (const c of curriculaSnap.docs) {
          try {
            const enrollDoc = await getDoc(
              doc(db, "enrollments", c.id, "students", currentUser.uid)
            );
            if (enrollDoc.exists()) enrolled++;
          } catch {}
        }

        const historySnap = await getDocs(
          query(
            collection(db, "studentHistory", currentUser.uid, "entries"),
            orderBy("timestamp", "desc")
          )
        );
        const history = historySnap.docs.map((d) => d.data());
        const downloaded = history.filter((h) => h.action === "downloaded").length;

        const viewedSnap = await getDocs(
          query(
            collection(db, "studentHistory", currentUser.uid, "entries"),
            where("action", "==", "viewed"),
            orderBy("timestamp", "desc"),
            limit(5)
          )
        );

        setStats({ enrolled, downloaded });
        setRecentViewed(viewedSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.warn("Could not load student dashboard stats from Firestore:", err.message);
      }
    }

    load();
    loadLiveStats();
  }, [currentUser, userProfile, loadLiveStats]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#EFF6FF] p-6">
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {userProfile?.name}</h1>
        <p className="mt-1 text-slate-500">{userProfile?.college}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={studentCount.value ?? "—"}
          icon={Users}
          loading={studentCount.loading}
          error={studentCount.error}
          onRefresh={loadLiveStats}
          refreshLabel="Refresh student count"
        />
        <StatCard
          label="Curricula Available"
          value={activeCurricula.value ?? "—"}
          icon={Library}
          loading={activeCurricula.loading}
          error={activeCurricula.error}
          onRefresh={loadLiveStats}
          refreshLabel="Refresh curricula count"
        />
        <StatCard
          label="Enrolled"
          value={stats.enrolled}
          icon={GraduationCap}
          iconClassName="text-emerald-500"
        />
        <StatCard
          label="PDFs Downloaded"
          value={stats.downloaded}
          icon={Download}
        />
      </div>

      <Link
        to="/student/browse"
        className="flex items-center gap-4 rounded-xl border border-brand/20 bg-[#EFF6FF] p-6 transition hover:shadow-md"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
          <Library className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Browse Curricula</h3>
          <p className="text-sm text-slate-500">Explore active learning paths from your college</p>
        </div>
      </Link>

      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
          <GraduationCap className="h-5 w-5 text-brand" aria-hidden="true" />
          Recently Viewed
        </h2>
        {recentViewed.length > 0 ? (
          <ul className="space-y-3">
            {recentViewed.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{entry.title}</p>
                  <p className="text-xs text-slate-400">
                    {entry.timestamp?.toDate?.()?.toLocaleString() || "—"}
                  </p>
                </div>
                <Link
                  to={`/student/curriculum/${entry.curriculumId}`}
                  className="text-xs text-brand hover:text-brand-dark"
                >
                  View →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No recently viewed curricula</p>
        )}
      </div>
    </div>
  );
}
