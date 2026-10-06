import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { CheckCircle, Download, PlusCircle } from "lucide-react";
import { invalidateChatCurriculumContext } from "../../utils/chatCurriculumContext";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { downloadCurriculumPDF } from "../../utils/generatePDF";
import { logStudentAction } from "../../hooks/useFirestore";
import {
  fetchStudentCompletions,
  makeTopicId,
  markTopicComplete,
} from "../../utils/topicCompletions";
import {
  getLocalCurriculumById,
  saveLocalEnrollment,
  isStudentEnrolledLocally,
  getLocalTopicCompletions,
} from "../../utils/localStore";
import CurriculumAccordion from "../shared/CurriculumAccordion";

export default function CurriculumDetail() {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const [curriculum, setCurriculum] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState({});
  const [markingTopicId, setMarkingTopicId] = useState(null);

  useEffect(() => {
    if (!id || !currentUser) return;
    loadCurriculum();
  }, [id, currentUser]);

  async function loadCurriculum() {
    setLoading(true);
    let data = null;
    try {
      const snap = await getDoc(doc(db, "curricula", id));
      if (snap.exists()) {
        data = { id: snap.id, ...snap.data() };
      }
    } catch {}

    if (!data) {
      data = getLocalCurriculumById(id);
    }

    if (data) {
      setCurriculum(data);

      let isEnrolled = false;
      try {
        const enrollSnap = await getDoc(
          doc(db, "enrollments", id, "students", currentUser.uid)
        );
        isEnrolled = enrollSnap.exists();
      } catch {
        isEnrolled = isStudentEnrolledLocally(id, currentUser.uid);
      }
      setEnrolled(isEnrolled);

      try {
        const saved = await fetchStudentCompletions(currentUser.uid, id);
        setCompletions(saved);
      } catch {
        setCompletions(getLocalTopicCompletions(currentUser.uid, id));
      }

      await logStudentAction(currentUser.uid, "viewed", id, data.title);
    }
    setLoading(false);
  }

  async function handleEnroll() {
    saveLocalEnrollment(id, currentUser.uid, userProfile || {});
    try {
      await setDoc(doc(db, "enrollments", id, "students", currentUser.uid), { enrolled: true });
    } catch {}
    await logStudentAction(currentUser.uid, "enrolled", id, curriculum?.title || "Curriculum");
    invalidateChatCurriculumContext();
    setEnrolled(true);
  }

  async function handleMarkComplete(courseCode, topicName) {
    const topicId = makeTopicId(courseCode, topicName);
    if (completions[topicId]) return;

    setMarkingTopicId(topicId);
    setCompletions((prev) => ({ ...prev, [topicId]: new Date() }));

    try {
      await markTopicComplete(currentUser.uid, id, courseCode, topicId);
    } catch {
      setCompletions((prev) => {
        const next = { ...prev };
        delete next[topicId];
        return next;
      });
    } finally {
      setMarkingTopicId(null);
    }
  }

  async function handleDownload() {
    const pdfData = { ...curriculum, semesters: curriculum.semesterData };
    downloadCurriculumPDF(pdfData, curriculum.teacherName, curriculum.college);
    await logStudentAction(currentUser.uid, "downloaded", id, curriculum.title);
    await updateDoc(doc(db, "curricula", id), { downloadCount: increment(1) });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!curriculum) {
    return <p className="py-12 text-center text-slate-400">Curriculum not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{curriculum.title}</h1>
          <p className="mt-1 text-slate-500">
            {curriculum.skill} · {curriculum.level} · {curriculum.semesters} semesters
          </p>
          <p className="text-sm text-slate-400">
            By {curriculum.teacherName} · {curriculum.college}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {enrolled ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle className="h-4 w-4" /> Enrolled
            </span>
          ) : (
            <button
              onClick={handleEnroll}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Enroll
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </button>
        </div>
      </div>

      <CurriculumAccordion
        curriculum={{ ...curriculum, semesters: curriculum.semesterData }}
        interactive
        completions={completions}
        onMarkComplete={handleMarkComplete}
        markingTopicId={markingTopicId}
      />
    </div>
  );
}
