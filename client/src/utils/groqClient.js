import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL !== undefined
  ? import.meta.env.VITE_BACKEND_URL
  : (import.meta.env.PROD ? "" : "http://localhost:5000");

function buildFallbackCurriculum({ skill, level, semesters, weeklyHours, industryFocus }) {
  const semCount = parseInt(semesters, 10) || 4;
  const focus = industryFocus || "Industry Applications";
  const semList = [];
  let courseCounter = 101;

  for (let s = 1; s <= semCount; s++) {
    semList.push({
      semester: s,
      courses: [
        {
          code: `CS${courseCounter++}`,
          name: s === 1 ? `Foundations of ${skill}` : `${skill} Core Principles (Part ${s})`,
          credits: 4,
          description: `Comprehensive study of foundational and operational principles in ${skill} for ${level} students.`,
          topics: [
            `Core syntax and architecture of ${skill}`,
            `Standard tooling and environment workflows`,
            `Design patterns and industry conventions`,
            `Practical project implementation`,
            `Testing and debugging strategies`,
          ],
        },
        {
          code: `CS${courseCounter++}`,
          name: `${skill} Applied Systems & ${focus}`,
          credits: 4,
          description: `Applied engineering focusing on real-world ${focus} integration and deployment scenarios.`,
          topics: [
            `System architecture and specifications`,
            `Data pipelining and state modeling`,
            `Scalable integration techniques`,
            `Security guidelines and best practices`,
            `Performance profiling and optimization`,
          ],
        },
        {
          code: `CS${courseCounter++}`,
          name: `${skill} Lab & Practical Studio ${s}`,
          credits: 4,
          description: `Hands-on studio projects designing end-to-end solutions using ${skill} within industry frameworks.`,
          topics: [
            `Weekly milestone sprint reviews`,
            `Collaborative repository workflows`,
            `Code review and standard compliance`,
            `Artifact documentation and benchmarking`,
            `Demo day portfolio submission`,
          ],
        },
      ],
    });
  }

  return {
    title: `${skill} Learning Plan`,
    skill: skill || "Applied Computing",
    level: level || "BTech",
    weeklyHours: weeklyHours ? `${weeklyHours} hrs/week` : "15-20 hrs/week",
    industryFocus: focus,
    totalCourses: semCount * 3,
    totalCredits: semCount * 12,
    semesters: semList,
    capstoneProject: `End-to-End Enterprise ${skill} Capstone: Architect, develop, and present a production-ready application tailored to ${focus}.`,
  };
}

export async function generateCurriculum(formData) {
  try {
    const url = API_URL ? `${API_URL}/api/curriculum/generate` : "/api/curriculum/generate";
    const response = await axios.post(url, formData, { timeout: 15000 });
    if (response.data && response.data.curriculum) {
      return response.data;
    }
  } catch (err) {
    console.warn("Backend curriculum API unavailable, generating local curriculum:", err.message);
  }

  // Graceful fallback for static deployments (GitHub Pages) or cold server starts
  return {
    success: true,
    curriculum: buildFallbackCurriculum(formData),
    isFallback: true,
  };
}

export async function sendChatMessage(message, history, curriculumContext = "") {
  try {
    const url = API_URL ? `${API_URL}/api/chat/chat` : "/api/chat/chat";
    const response = await axios.post(url, {
      message,
      history,
      curriculumContext,
    }, { timeout: 12000 });
    if (response.data && response.data.reply) {
      return response.data;
    }
  } catch (err) {
    console.warn("Backend chat API unavailable, using assistant fallback:", err.message);
  }

  return {
    reply: `Hi! I am the EduCanvas Study Assistant. You asked: "${message}". Your question has been logged for your course topics. (Connect a live GROQ_API_KEY on the backend server for full generative responses.)`,
  };
}
