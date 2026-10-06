import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { saveLocalHistory, getLocalEnrollmentList } from "../utils/localStore";

export async function logTeacherAction(uid, action, curriculumId, title, snapshot) {
  // Always log locally
  saveLocalHistory("teacher", uid, { curriculumId, title, action, snapshot });

  try {
    await addDoc(collection(db, "teacherHistory", uid, "entries"), {
      curriculumId,
      title,
      action,
      timestamp: serverTimestamp(),
      snapshot,
    });
  } catch (err) {
    console.warn("Could not log teacher action to Firestore (saved locally):", err.message);
  }
}

export async function logStudentAction(uid, action, curriculumId, title) {
  // Always log locally
  saveLocalHistory("student", uid, { curriculumId, title, action });

  try {
    await addDoc(collection(db, "studentHistory", uid, "entries"), {
      curriculumId,
      title,
      action,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not log student action to Firestore (saved locally):", err.message);
  }
}

export async function getEnrollmentCount(curriculumId) {
  try {
    const { getDocs, collection: col } = await import("firebase/firestore");
    const snapshot = await getDocs(col(db, "enrollments", curriculumId, "students"));
    return snapshot.size;
  } catch {
    return getLocalEnrollmentList(curriculumId).length;
  }
}
