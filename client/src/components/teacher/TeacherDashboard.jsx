import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { BookOpen, GraduationCap, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";

export default function TeacherDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState({
    curriculaCount: 0,
    enrolledStudents: 0,
    resourcesCount: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

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

        const curricula = curriculaSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        let totalEnrolled = 0;
        const allEnrollments = [];

        for (const c of curricula) {
          const enrollSnap = await getDocs(
            collection(db, "enrollments", c.id, "students")
          );
          totalEnrolled += enrollSnap.size;

          for (const enrollDoc of enrollSnap.docs) {
            try {
              const userSnap = await getDoc(doc(db, "users", enrollDoc.id));
              const profile = userSnap.exists() ? userSnap.data() : {};
              allEnrollments.push({
                id: enrollDoc.id,
                curriculumTitle: c.title,
                studentName: profile.name || "Student",
              });
            } catch {}
          }
        }

        setStats({
          curriculaCount: curricula.length,
          enrolledStudents: totalEnrolled,
          resourcesCount: curricula.length,
        });
        setRecentEnrollments(allEnrollments.slice(0, 5));
      } catch (err) {
        console.warn("Could not load teacher dashboard stats from Firestore:", err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentUser]);

  const statCards = [
    {
      label: "My Curricula",
      value: stats.curriculaCount,
      emoji: "📚",
      icon: BookOpen,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-500",
    },
    {
      label: "Enrolled Students",
      value: stats.enrolledStudents,
      emoji: "🎓",
      icon: GraduationCap,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-500",
    },
    {
      label: "Uploaded Resources",
      value: stats.resourcesCount,
      emoji: "📖",
      icon: FileText,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-500",
    },
  ];

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
        <h1 className="text-2xl font-bold text-slate-800">
          Faculty Dashboard 👩‍🏫
        </h1>
        <p className="mt-1 text-slate-500">
          Welcome back, {userProfile?.name} | {userProfile?.college}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map(({ label, value, emoji, icon: Icon, iconBg, iconColor }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-800">
                  {value} {emoji}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-800">
            Recent Student Enrollments 🎓
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest sign-ups across your curricula with live progress and quick actions.
          </p>
        </div>

        {recentEnrollments.length > 0 ? (
          <ul className="divide-y divide-slate-50">
            {recentEnrollments.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {entry.studentName}
                  </p>
                  <p className="text-xs text-slate-400">{entry.curriculumTitle}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  Enrolled
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50">
              <GraduationCap className="h-7 w-7 text-brand" />
            </div>
            <p className="font-semibold text-slate-800">No Enrollments Yet 🎓</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Students can browse and enroll in your curricula from the student portal.
            </p>
            <Link
              to="/teacher/curricula"
              className="mt-4 rounded-full border border-brand px-5 py-2 text-sm font-medium text-brand transition hover:bg-[#EEF2FF]"
            >
              View My Curricula
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
