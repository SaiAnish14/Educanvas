import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { getLocalCurricula } from "../../utils/localStore";
import StudentProgressPanel from "./StudentProgressPanel";

export default function ManageStudents() {
  const { currentUser } = useAuth();
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
        console.warn("Using localStore for ManageStudents:", err.message);
        setCurricula(getLocalCurricula({ teacherId: currentUser.uid, isPublished: true }));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentUser]);

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
        <h1 className="text-2xl font-bold text-slate-800">Manage Students 🎓</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track enrollment and topic progress across all your published curricula.
        </p>
      </div>

      {curricula.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-white py-16 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50">
            <GraduationCap className="h-7 w-7 text-brand" />
          </div>
          <p className="font-semibold text-slate-800">No Published Curricula</p>
          <p className="mt-1 text-sm text-slate-500">
            Post a curriculum first to start tracking student enrollments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {curricula.map((curriculum) => (
            <div
              key={curriculum.id}
              className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-3 font-semibold text-slate-800">{curriculum.title}</h2>
              <StudentProgressPanel curriculum={curriculum} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
