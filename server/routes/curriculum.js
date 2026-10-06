require("dotenv").config();
const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  try {
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (err) {
    console.error("Failed to initialize Groq client:", err.message);
    return null;
  }
}

function generateCurriculumFallback(skill, level, semesters, weeklyHours, industryFocus) {
  const semCount = parseInt(semesters, 10) || 4;
  const focus = industryFocus || "Industry Systems";
  const semList = [];
  let codeCounter = 101;

  for (let s = 1; s <= semCount; s++) {
    semList.push({
      semester: s,
      courses: [
        {
          code: `CS${codeCounter++}`,
          name: s === 1 ? `Foundations of ${skill}` : `Advanced ${skill} Architecture (Part ${s})`,
          credits: 4,
          description: `Fundamental and operational principles of ${skill} for ${level} students.`,
          topics: [
            `Core Architecture of ${skill}`,
            `Developer Tooling and Workflows`,
            `Applied Design Principles`,
            `Practical Implementation Labs`,
            `Testing and Quality Assurance`,
          ],
        },
        {
          code: `CS${codeCounter++}`,
          name: `${skill} Enterprise Systems & ${focus}`,
          credits: 4,
          description: `Comprehensive integration emphasizing production ${focus} requirements.`,
          topics: [
            `System Design and Requirements`,
            `Data Modeling and Lifecycle`,
            `Scalable Deployment Patterns`,
            `Security & Compliance Guidelines`,
            `Performance Monitoring & Benchmarking`,
          ],
        },
        {
          code: `CS${codeCounter++}`,
          name: `${skill} Practical Studio & Capstone Lab ${s}`,
          credits: 4,
          description: `Hands-on project work developing end-to-end deliverables in ${skill}.`,
          topics: [
            `Sprint Planning and Milestones`,
            `Collaborative Code Reviews`,
            `Integration Testing`,
            `Technical Documentation`,
            `Presentation and Evaluation`,
          ],
        },
      ],
    });
  }

  return {
    title: `${skill} Learning Plan`,
    skill,
    level,
    weeklyHours: weeklyHours || "15-20 hrs/week",
    industryFocus: focus,
    totalCourses: semCount * 3,
    totalCredits: semCount * 12,
    semesters: semList,
    capstoneProject: `Enterprise ${skill} Project: Architect and deploy a scalable platform tailored to ${focus}.`,
  };
}

router.post("/generate", async (req, res) => {
  try {
    const { skill, level, semesters, weeklyHours, industryFocus } = req.body;

    if (!skill || !level || !semesters) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const prompt = `
You are an expert educational curriculum designer.
Generate a complete, structured academic curriculum in valid JSON format ONLY.
No explanation, no markdown, only raw JSON.

Parameters:
- Skill: ${skill}
- Education Level: ${level}
- Number of Semesters: ${semesters}
- Weekly Study Hours: ${weeklyHours || "Not specified"}
- Industry Focus: ${industryFocus || "General Technology"}

Return this exact JSON structure:
{
  "title": "<Skill> Learning Plan",
  "skill": "${skill}",
  "level": "${level}",
  "weeklyHours": "${weeklyHours || ""}",
  "industryFocus": "${industryFocus || "General Technology"}",
  "totalCourses": <number>,
  "totalCredits": <number>,
  "semesters": [
    {
      "semester": 1,
      "courses": [
        {
          "code": "CS101",
          "name": "<Course Name>",
          "credits": 4,
          "description": "<2-sentence description>",
          "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
        }
      ]
    }
  ],
  "capstoneProject": "<Capstone project description>"
}

Rules:
- ${semesters} semesters total
- 3 courses per semester
- 4 credits per course
- 5 topics per course
- Topics must be specific, technical, and relevant to ${skill} and ${industryFocus || "General Technology"}
- Courses must progress logically from foundational to advanced
`;

    const groq = getGroqClient();
    if (!groq) {
      const curriculum = generateCurriculumFallback(skill, level, semesters, weeklyHours, industryFocus);
      return res.json({ success: true, curriculum, isDemo: true });
    }

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 4000,
      });

      const raw = completion.choices[0].message.content.trim();
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const curriculum = JSON.parse(cleaned);

      res.json({ success: true, curriculum });
    } catch (groqErr) {
      console.warn("Groq API call failed, falling back to local curriculum generator:", groqErr.message);
      const curriculum = generateCurriculumFallback(skill, level, semesters, weeklyHours, industryFocus);
      res.json({ success: true, curriculum, isDemo: true });
    }
  } catch (error) {
    console.error("Curriculum generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate curriculum",
    });
  }
});

module.exports = router;
