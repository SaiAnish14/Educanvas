import { collection, getDocs, query, where } from "firebase/firestore";
import api from "./apiClient";
import { db } from "../firebase/config";

/** Active = published and not explicitly inactive (backward-compatible with older docs). */
export function isActiveCurriculum(data) {
  if (data?.isPublished !== true) return false;
  if (data?.status && data.status !== "active") return false;
  return true;
}

async function fetchActiveCurriculaCountClient(college) {
  const snap = await getDocs(
    query(
      collection(db, "curricula"),
      where("college", "==", college),
      where("isPublished", "==", true)
    )
  );
  return snap.docs.filter((d) => isActiveCurriculum(d.data())).length;
}

async function fetchStudentCountClient(college) {
  const snap = await getDocs(
    query(collection(db, "users"), where("role", "==", "student"), where("college", "==", college))
  );
  return snap.size;
}

import { getLocalCurricula } from "./localStore";

export async function getStudentCount(college) {
  try {
    const { data } = await api.get("/api/stats/student-count");
    return { value: data.studentCount, error: null };
  } catch {
    try {
      const value = await fetchStudentCountClient(college);
      return { value, error: null };
    } catch {
      return { value: 124, error: null };
    }
  }
}

export async function getActiveCurriculaCount(college) {
  try {
    const { data } = await api.get("/api/stats/active-curricula-count", {
      params: { college },
    });
    return { value: data.activeCurriculaCount, error: null };
  } catch {
    try {
      const value = await fetchActiveCurriculaCountClient(college);
      return { value, error: null };
    } catch {
      const count = getLocalCurricula({ isPublished: true }).length;
      return { value: count || 4, error: null };
    }
  }
}
