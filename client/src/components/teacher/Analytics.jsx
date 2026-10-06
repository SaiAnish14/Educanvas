import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Clock, TrendingUp, Library } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import StatCard from "../shared/StatCard";
import { getActiveCurriculaCount } from "../../utils/statsApi";
import { getLocalCurricula, getLocalEnrollmentList, getLocalHistory } from "../../utils/localStore";

export default function Analytics() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalPosted: 0,
    totalEnrollments: 0,
    popularTitle: "—",
    monthActivity: 0,
  });
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeCurricula, setActiveCurricula] = useState({
    value: null,
    loading: true,
    error: null,
  });

  async function loadActiveCurriculaCount() {
    if (!userProfile?.college) return;
    setActiveCurricula((s) => ({ ...s, loading: true, error: null }));
    const result = await getActiveCurriculaCount(userProfile.college);
    setActiveCurricula({ value: result.value, loading: false, error: result.error });
  }

  useEffect(() => {
    if (!currentUser) return;

    async function load() {
      try {
        const curriculaSnap = await getDocs(
          query(
            collection(db, "curricula"),
            where("teacherId", "==", currentUser.uid),
            where("isPublished", "==", true)
          )
        );

        let curricula = curriculaSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (curricula.length === 0) {
          curricula = getLocalCurricula({ teacherId: currentUser.uid, isPublished: true });
        }

        let totalEnrollments = 0;
        let maxEnroll = 0;
        let popularTitle = "—";

        const chartData = await Promise.all(
          curricula.map(async (c) => {
            let count = 0;
            try {
              const enrollSnap = await getDocs(
                collection(db, "enrollments", c.id, "students")
              );
              count = enrollSnap.size;
            } catch {
              count = getLocalEnrollmentList(c.id).length;
            }
            totalEnrollments += count;
            if (count > maxEnroll) {
              maxEnroll = count;
              popularTitle = c.title;
            }
            return {
              name: c.title.length > 20 ? c.title.substring(0, 20) + "…" : c.title,
              count,
            };
          })
        );

        let recent = [];
        try {
          const historySnap = await getDocs(
            query(
              collection(db, "teacherHistory", currentUser.uid, "entries"),
              orderBy("timestamp", "desc"),
              limit(5)
            )
          );
          recent = historySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch {
          recent = getLocalHistory("teacher", currentUser.uid).slice(0, 5);
        }

        setStats({
          totalPosted: curricula.length,
          totalEnrollments,
          popularTitle,
          monthActivity: recent.length,
        });
        setEnrollmentData(chartData);
        setRecentActivity(recent);
      } catch (err) {
        console.warn("Using localStore for Analytics:", err.message);
        const curricula = getLocalCurricula({ teacherId: currentUser.uid, isPublished: true });
        const chartData = curricula.map((c) => ({
          name: c.title.length > 20 ? c.title.substring(0, 20) + "…" : c.title,
          count: getLocalEnrollmentList(c.id).length,
        }));
        const recent = getLocalHistory("teacher", currentUser.uid).slice(0, 5);
        setStats({
          totalPosted: curricula.length,
          totalEnrollments: chartData.reduce((s, i) => s + i.count, 0),
          popularTitle: curricula[0]?.title || "—",
          monthActivity: recent.length,
        });
        setEnrollmentData(chartData);
        setRecentActivity(recent);
      }
    }

    load();
    loadActiveCurriculaCount();
  }, [currentUser, userProfile?.college]);

  const actionColors = {
    generated: "bg-blue-100 text-blue-700",
    posted: "bg-emerald-100 text-emerald-700",
    edited: "bg-amber-100 text-amber-700",
    deleted: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics 📊</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enrollment trends, activity metrics, and curriculum performance.
          </p>
        </div>
        <Link
          to="/teacher/history"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Clock className="h-4 w-4" />
          View History
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Curricula"
          value={activeCurricula.value ?? "—"}
          icon={Library}
          loading={activeCurricula.loading}
          error={activeCurricula.error}
          onRefresh={loadActiveCurriculaCount}
          refreshLabel="Refresh active curricula count"
        />
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Enrollments</p>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{stats.totalEnrollments}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Most Popular</p>
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 truncate text-sm font-bold text-slate-800">{stats.popularTitle}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">This Month</p>
            <Activity className="h-5 w-5 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{stats.monthActivity}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Enrollment by Curriculum</h2>
          {enrollmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={enrollmentData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">No curricula posted yet</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <ul className="space-y-3">
              {recentActivity.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between border-b border-slate-50 pb-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{entry.title}</p>
                    <p className="text-xs text-slate-400">
                      {entry.timestamp?.toDate?.()?.toLocaleString() || "—"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                      actionColors[entry.action] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {entry.action}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">No activity yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
