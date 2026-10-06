import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

export function makeTopicId(courseCode, topicName) {
  return `${courseCode}::${topicName}`;
}

export function getSemesters(curriculum) {
  return curriculum?.semesterData || curriculum?.semesters || [];
}

export function countTotalTopics(curriculum) {
  return getSemesters(curriculum).reduce(
    (sum, sem) => sum + sem.courses.reduce((s, course) => s + course.topics.length, 0),
    0
  );
}

export function countCourseTopics(course) {
  return course.topics.length;
}

export function countCompletedInCourse(course, completions) {
  return course.topics.filter((topic) => completions[makeTopicId(course.code, topic)]).length;
}

export function progressPercent(completed, total) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

export function progressBarColor(percent) {
  if (percent >= 70) return "#639922";
  if (percent >= 30) return "#EF9F27";
  return "#E24B4A";
}

function completionDocId(studentId, curriculumId, topicId) {
  const safeTopicId = topicId.replace(/[/\\]/g, "_");
  return `${studentId}_${curriculumId}_${safeTopicId}`;
}

import {
  getLocalTopicCompletions,
  saveLocalTopicCompletion,
  getLocalEnrollmentList,
} from "./localStore";

export async function fetchStudentCompletions(studentId, curriculumId) {
  try {
    const snap = await getDocs(
      query(
        collection(db, "topic_completions"),
        where("studentId", "==", studentId),
        where("curriculumId", "==", curriculumId)
      )
    );

    const map = {};
    snap.docs.forEach((d) => {
      map[d.data().topicId] = d.data().completedAt || new Date().toISOString();
    });
    return map;
  } catch (err) {
    console.warn("Using local completions fallback:", err.message);
    return getLocalTopicCompletions(studentId, curriculumId);
  }
}

export async function markTopicComplete(studentId, curriculumId, courseCode, topicId) {
  saveLocalTopicCompletion(studentId, curriculumId, topicId);

  try {
    const docRef = doc(
      db,
      "topic_completions",
      completionDocId(studentId, curriculumId, topicId)
    );
    const existing = await getDoc(docRef);
    if (existing.exists()) return existing.data().completedAt;

    const payload = {
      studentId,
      curriculumId,
      courseCode,
      topicId,
      completedAt: serverTimestamp(),
    };
    await setDoc(docRef, payload);
    return payload;
  } catch (err) {
    console.warn("Could not save completion to Firestore (saved locally):", err.message);
    return { completedAt: new Date().toISOString() };
  }
}

export async function fetchCurriculumCompletions(curriculumId) {
  try {
    const snap = await getDocs(
      query(collection(db, "topic_completions"), where("curriculumId", "==", curriculumId))
    );

    const byStudent = {};
    snap.docs.forEach((d) => {
      const { studentId, topicId } = d.data();
      if (!byStudent[studentId]) byStudent[studentId] = new Set();
      byStudent[studentId].add(topicId);
    });

    return Object.entries(byStudent).map(([studentId, topicSet]) => ({
      studentId,
      completedTopics: [...topicSet],
    }));
  } catch (err) {
    console.warn("Using local curriculum completions fallback:", err.message);
    return [];
  }
}

export async function fetchEnrolledStudents(curriculumId) {
  try {
    const enrollSnap = await getDocs(collection(db, "enrollments", curriculumId, "students"));
    const students = await Promise.all(
      enrollSnap.docs.map(async (enrollDoc) => {
        const studentId = enrollDoc.id;
        try {
          const userSnap = await getDoc(doc(db, "users", studentId));
          const profile = userSnap.exists() ? userSnap.data() : {};
          return {
            studentId,
            studentName: profile.name || "Student",
          };
        } catch {
          return {
            studentId,
            studentName: "Student",
          };
        }
      })
    );
    if (students.length > 0) return students;
  } catch (err) {
    console.warn("Using local enrollments fallback:", err.message);
  }

  const localList = getLocalEnrollmentList(curriculumId);
  return localList.map(e => ({
    studentId: e.studentId,
    studentName: e.studentName || "Student",
  }));
}

export function categorizeStudentProgress(completedCount, totalTopics) {
  if (totalTopics === 0) return "notStarted";
  if (completedCount === 0) return "notStarted";
  if (completedCount >= totalTopics) return "completed";
  return "inProgress";
}

export function buildDonutSegments(studentRows, totalTopics) {
  if (!studentRows.length || !totalTopics) {
    return [
      { name: "Not started", value: 100, color: "#B4B2A9" },
      { name: "In progress", value: 0, color: "#EF9F27" },
      { name: "Completed", value: 0, color: "#639922" },
    ];
  }

  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  studentRows.forEach((row) => {
    const category = categorizeStudentProgress(row.completedCount, totalTopics);
    if (category === "completed") completed += 1;
    else if (category === "inProgress") inProgress += 1;
    else notStarted += 1;
  });

  const total = studentRows.length;
  return [
    { name: "Completed", value: Math.round((completed / total) * 100), color: "#639922" },
    { name: "In progress", value: Math.round((inProgress / total) * 100), color: "#EF9F27" },
    { name: "Not started", value: Math.round((notStarted / total) * 100), color: "#B4B2A9" },
  ];
}

export function avatarColor(name) {
  const palette = ["#4F46E5", "#0D9488", "#D97706", "#E24B4A", "#639922", "#7C3AED"];
  const code = (name || "?").charCodeAt(0);
  return palette[code % palette.length];
}

export function studentInitials(name) {
  const parts = (name || "?").trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}
