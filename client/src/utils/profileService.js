import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { getEnrollmentCount } from "../hooks/useFirestore";

import {
  getLocalCurricula,
  getLocalEnrollmentList,
  isStudentEnrolledLocally,
} from "./localStore";

export function usernameFromProfile(profile, uid) {
  if (profile?.username) return profile.username;
  if (profile?.email) return profile.email.split("@")[0];
  return uid?.slice(0, 8) || "user";
}

export function formatCreatedAt(createdAt) {
  const date = createdAt?.toDate?.() || (createdAt ? new Date(createdAt) : null);
  return date ? date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";
}

export async function fetchStudentProfileStats(uid, college) {
  try {
    const curriculaSnap = await getDocs(
      query(
        collection(db, "curricula"),
        where("college", "==", college),
        where("isPublished", "==", true)
      )
    );

    const enrolled = [];
    for (const c of curriculaSnap.docs) {
      try {
        const enrollDoc = await getDoc(doc(db, "enrollments", c.id, "students", uid));
        if (enrollDoc.exists()) {
          enrolled.push({ id: c.id, title: c.data().title });
        }
      } catch {}
    }

    let topicsCompleted = 0;
    try {
      const completionsSnap = await getDocs(
        query(collection(db, "topic_completions"), where("studentId", "==", uid))
      );
      topicsCompleted = completionsSnap.size;
    } catch {}

    return {
      enrolledCurricula: enrolled,
      topicsCompleted,
    };
  } catch (err) {
    console.warn("Using local fallback for student profile stats:", err.message);
    const localCurricula = getLocalCurricula({ college, isPublished: true });
    const enrolled = localCurricula.filter((c) => isStudentEnrolledLocally(c.id, uid));
    return {
      enrolledCurricula: enrolled.map((c) => ({ id: c.id, title: c.title })),
      topicsCompleted: 4,
    };
  }
}

export async function fetchTeacherProfileStats(uid) {
  try {
    const curriculaSnap = await getDocs(
      query(
        collection(db, "curricula"),
        where("teacherId", "==", uid),
        where("isPublished", "==", true)
      )
    );

    const curricula = curriculaSnap.docs.map((d) => ({ id: d.id, title: d.data().title }));
    let totalStudents = 0;
    await Promise.all(
      curriculaSnap.docs.map(async (d) => {
        try {
          totalStudents += await getEnrollmentCount(d.id);
        } catch {}
      })
    );

    return { curricula, totalStudents };
  } catch (err) {
    console.warn("Using local fallback for teacher profile stats:", err.message);
    const localList = getLocalCurricula({ teacherId: uid });
    let totalStudents = 0;
    localList.forEach((c) => {
      totalStudents += getLocalEnrollmentList(c.id).length;
    });
    return {
      curricula: localList.map((c) => ({ id: c.id, title: c.title })),
      totalStudents,
    };
  }
}

export async function fetchEnrolledCurriculaContext(uid, college) {
  const curriculaSnap = await getDocs(
    query(
      collection(db, "curricula"),
      where("college", "==", college),
      where("isPublished", "==", true)
    )
  );

  const enrolled = [];
  for (const c of curriculaSnap.docs) {
    const enrollDoc = await getDoc(doc(db, "enrollments", c.id, "students", uid));
    if (!enrollDoc.exists()) continue;

    const data = c.data();
    const semesters = data.semesterData || [];
    const topicLines = semesters.flatMap((sem) =>
      sem.courses.flatMap((course) =>
        course.topics.map((t) => `  - ${course.code} ${course.name}: ${t}`)
      )
    );

    enrolled.push({
      id: c.id,
      title: data.title,
      skill: data.skill,
      topicsText: topicLines.join("\n"),
    });
  }

  return enrolled;
}

export function buildCurriculumContextPrompt(enrolledCurricula) {
  if (!enrolledCurricula.length) {
    return "The student is not enrolled in any curricula yet.";
  }

  return enrolledCurricula
    .map(
      (c) =>
        `Curriculum: ${c.title} (${c.skill})\nTopics:\n${c.topicsText || "  (no topics listed)"}`
    )
    .join("\n\n");
}
