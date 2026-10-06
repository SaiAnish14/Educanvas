import { useEffect, useState } from "react";
import { CheckCircle, GraduationCap, BookOpen, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchStudentProfileStats,
  fetchTeacherProfileStats,
  formatCreatedAt,
  usernameFromProfile,
} from "../../utils/profileService";
import { avatarColor, studentInitials } from "../../utils/topicCompletions";

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="mx-auto h-20 w-20 rounded-full bg-slate-100" />
      <div className="h-4 rounded bg-slate-100" />
      <div className="h-24 rounded bg-slate-100" />
    </div>
  );
}

export default function ProfilePage() {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extra, setExtra] = useState(null);

  useEffect(() => {
    if (!currentUser || !userProfile) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (userProfile.role === "student") {
          const data = await fetchStudentProfileStats(currentUser.uid, userProfile.college);
          setExtra(data);
        } else {
          const data = await fetchTeacherProfileStats(currentUser.uid);
          setExtra(data);
        }
      } catch (err) {
        console.warn("Profile stats loading issue:", err.message);
        setExtra(userProfile.role === "student" ? { enrolledCurricula: [], topicsCompleted: 0 } : { curricula: [], totalStudents: 0 });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentUser, userProfile]);

  const isStudent = userProfile?.role === "student";
  const roleLabel = isStudent ? "Student" : "Faculty";
  const displayName = userProfile?.name || currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profile 👤</h1>
        <p className="mt-1 text-sm text-slate-500">Your account details and activity summary.</p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        {loading ? (
          <ProfileSkeleton />
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: avatarColor(userProfile.name) }}
              >
                {studentInitials(userProfile.name)}
              </div>
              <p className="mt-3 text-xl font-semibold text-slate-800">{userProfile.name}</p>
              <p className="text-sm text-brand">{roleLabel}</p>
            </div>

            <hr className="my-6 border-slate-100" />

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Username</dt>
                <dd className="font-medium text-slate-800">
                  {usernameFromProfile(userProfile, currentUser.uid)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="break-all text-right font-medium text-slate-800">
                  {userProfile.email || currentUser.email}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Institution</dt>
                <dd className="text-right font-medium text-slate-800">{userProfile.college}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Member since</dt>
                <dd className="font-medium text-slate-800">
                  {formatCreatedAt(userProfile.createdAt)}
                </dd>
              </div>
            </dl>

            <hr className="my-6 border-slate-100" />

            {isStudent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <GraduationCap className="h-4 w-4 text-brand" />
                  Enrolled Curricula ({extra?.enrolledCurricula?.length || 0})
                </div>
                {extra?.enrolledCurricula?.length ? (
                  <ul className="space-y-1 text-sm text-slate-600">
                    {extra.enrolledCurricula.map((c) => (
                      <li key={c.id} className="rounded bg-slate-50 px-3 py-2">
                        {c.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">No enrollments yet.</p>
                )}
                <div className="flex items-center justify-between rounded-lg bg-[#EAF3DE] px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-[#27500A]">
                    <CheckCircle className="h-4 w-4" />
                    Topics completed
                  </span>
                  <span className="text-lg font-bold text-[#27500A]">
                    {extra?.topicsCompleted ?? 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <BookOpen className="h-4 w-4 text-brand" />
                  Curricula created ({extra?.curricula?.length || 0})
                </div>
                {extra?.curricula?.length ? (
                  <ul className="space-y-1 text-sm text-slate-600">
                    {extra.curricula.map((c) => (
                      <li key={c.id} className="rounded bg-slate-50 px-3 py-2">
                        {c.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">No published curricula yet.</p>
                )}
                <div className="flex items-center justify-between rounded-lg bg-[#EEF2FF] px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-brand">
                    <Users className="h-4 w-4" />
                    Total students enrolled
                  </span>
                  <span className="text-lg font-bold text-brand">{extra?.totalStudents ?? 0}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
