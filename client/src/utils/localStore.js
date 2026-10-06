// Resilient Local Storage Data Layer for EduCanvas
// Provides instant offline/demo fallback when Cloud Firestore security rules are restricted

const DEFAULT_CURRICULA = [
  {
    id: "curriculum-ai-ml-101",
    title: "Artificial Intelligence & Machine Learning Specialization",
    skill: "Artificial Intelligence & ML",
    level: "BTech",
    semesters: 4,
    weeklyHours: "20 hrs/week",
    industryFocus: "Deep Learning & NLP Systems",
    college: "Global University",
    teacherId: "sample-teacher-1",
    teacherName: "Prof. Sarah Jenkins",
    isPublished: true,
    status: "active",
    downloadCount: 42,
    postedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    capstoneProject: "Autonomous Multi-Modal Diagnostic Agent deployed on Kubernetes with low-latency LLM serving.",
    semesterData: [
      {
        semester: 1,
        courses: [
          {
            code: "AIML101",
            name: "Mathematical Foundations & Statistical Learning",
            credits: 4,
            description: "Linear algebra, multivariate calculus, optimization algorithms, and probabilistic graphical models.",
            topics: [
              "Vector Spaces & Matrix Decompositions (SVD, PCA)",
              "Gradient Descent Variants & Convex Optimization",
              "Probability Distributions & Bayesian Inference",
              "Maximum Likelihood Estimation & Loss Functions",
              "Statistical Significance & Hypothesis Testing",
            ],
          },
          {
            code: "AIML102",
            name: "Supervised Learning & Feature Engineering",
            credits: 4,
            description: "Regression, classification, ensemble models, and data pipeline construction using scikit-learn.",
            topics: [
              "Data Preprocessing & Robust Scaling Techniques",
              "Linear & Logistic Regression with Regularization",
              "Decision Trees, Random Forests & Gradient Boosting",
              "Model Evaluation Metrics (ROC-AUC, F1, PR Curves)",
              "Hyperparameter Tuning with Bayesian Optimization",
            ],
          },
          {
            code: "AIML103",
            name: "Applied Python for Machine Learning Lab",
            credits: 4,
            description: "Practical implementations using NumPy, Pandas, Matplotlib, and Scikit-Learn with benchmark datasets.",
            topics: [
              "Vectorized Array Operations with NumPy",
              "Exploratory Data Analysis with Pandas & Seaborn",
              "Reproducible Data Pipelines with Scikit-Learn",
              "Unit Testing ML Code with PyTest",
              "Version Control for Data Science with DVC",
            ],
          },
        ],
      },
      {
        semester: 2,
        courses: [
          {
            code: "AIML201",
            name: "Deep Learning Architectures & PyTorch",
            credits: 4,
            description: "Feedforward networks, convolutional neural networks, backpropagation, and PyTorch tensors.",
            topics: [
              "Neural Network Mechanics & Backpropagation Calculus",
              "Convolutional Operators & Vision Backbones (ResNet)",
              "Recurrent Networks & Attention Foundations",
              "Batch Normalization, Dropout & Regularization",
              "PyTorch Lightning for Scalable Training",
            ],
          },
          {
            code: "AIML202",
            name: "Natural Language Processing & Transformers",
            credits: 4,
            description: "Tokenization, self-attention mechanisms, BERT, GPT, and modern Large Language Model pipelines.",
            topics: [
              "Text Tokenization (BPE, WordPiece, SentencePiece)",
              "Transformer Architecture (Self-Attention, Positional Encoding)",
              "Encoder vs Decoder Models (BERT, RoBERTa, LLaMA)",
              "Parameter-Efficient Fine-Tuning (LoRA, QLoRA)",
              "RAG Pipelines with Vector Databases (FAISS, Pinecone)",
            ],
          },
          {
            code: "AIML203",
            name: "Deep Learning Systems Lab",
            credits: 4,
            description: "Hands-on GPU-accelerated modeling using PyTorch and Hugging Face Transformers.",
            topics: [
              "CUDA Acceleration & Mixed Precision Training",
              "Hugging Face Trainer API & Model Hub",
              "Vector Embedding Extraction & Search",
              "Quantization Techniques (bitsandbytes, GGUF)",
              "Fine-Tuning Open-Weights LLMs on Custom Datasets",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "curriculum-fullstack-cloud-102",
    title: "Cloud-Native Full Stack Web Engineering",
    skill: "Full Stack Web Development",
    level: "BTech",
    semesters: 4,
    weeklyHours: "18 hrs/week",
    industryFocus: "Microservices & Distributed Systems",
    college: "Global University",
    teacherId: "sample-teacher-2",
    teacherName: "Dr. Alex Rivera",
    isPublished: true,
    status: "active",
    downloadCount: 35,
    postedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    capstoneProject: "Enterprise Cloud ERP Platform featuring real-time collaborative state and event-driven architecture.",
    semesterData: [
      {
        semester: 1,
        courses: [
          {
            code: "FS101",
            name: "Modern Frontend Engineering with React & TypeScript",
            credits: 4,
            description: "React 18 internals, component architecture, state management, and type-safe frontend design.",
            topics: [
              "TypeScript Foundations & Generics in React",
              "Virtual DOM, Reconciliation, and Fiber Architecture",
              "Custom Hooks & Component Composition Patterns",
              "Tailwind CSS & Design Systems Implementation",
              "Client Performance Profiling & Code Splitting",
            ],
          },
          {
            code: "FS102",
            name: "Scalable Backend APIs with Node.js & Express",
            credits: 4,
            description: "Event-driven asynchronous I/O, RESTful and GraphQL API design, authentication, and database pooling.",
            topics: [
              "Node.js Event Loop, Streams, and Worker Threads",
              "RESTful Resource Modeling & OpenAPI Documentation",
              "JWT & OAuth2 Authentication with Security Hardening",
              "Relational Modeling with PostgreSQL & Prisma ORM",
              "Caching Layers with Redis & In-Memory Stores",
            ],
          },
          {
            code: "FS103",
            name: "Full Stack Development Studio",
            credits: 4,
            description: "End-to-end web application development and automated testing workflows.",
            topics: [
              "Monorepo Architecture with Turborepo & npm workspaces",
              "End-to-End Testing with Playwright & Vitest",
              "Database Migrations & Seed Workflows",
              "Docker Containerization for Local Development",
              "Continuous Integration Pipelines with GitHub Actions",
            ],
          },
        ],
      },
    ],
  },
];

function getStored(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("localStorage write error:", err);
  }
}

// 1. Curricula Operations
export function getLocalCurricula(filters = {}) {
  let list = getStored("educanvas_curricula", DEFAULT_CURRICULA);
  if (!Array.isArray(list) || list.length === 0) {
    list = DEFAULT_CURRICULA;
    setStored("educanvas_curricula", list);
  }

  return list.filter((c) => {
    if (filters.isPublished !== undefined && c.isPublished !== filters.isPublished) return false;
    if (filters.teacherId && c.teacherId !== filters.teacherId) return false;
    if (filters.college && c.college && c.college.toLowerCase() !== filters.college.toLowerCase()) return false;
    return true;
  });
}

export function saveLocalCurriculum(docData) {
  const list = getLocalCurricula();
  const id = docData.id || `curriculum-${Date.now()}`;
  const newItem = {
    ...docData,
    id,
    postedAt: docData.postedAt || new Date().toISOString(),
    isPublished: docData.isPublished !== false,
    status: docData.status || "active",
    downloadCount: docData.downloadCount || 0,
  };

  const existingIdx = list.findIndex((c) => c.id === id);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...newItem };
  } else {
    list.unshift(newItem);
  }

  setStored("educanvas_curricula", list);
  return newItem;
}

export function updateLocalCurriculum(id, updates) {
  const list = getLocalCurricula();
  const idx = list.findIndex((c) => c.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updates };
    setStored("educanvas_curricula", list);
    return list[idx];
  }
  return null;
}

export function getLocalCurriculumById(id) {
  const list = getLocalCurricula();
  return list.find((c) => c.id === id) || null;
}

// 2. Enrollments Operations
export function getLocalEnrollmentList(curriculumId) {
  const all = getStored("educanvas_enrollments", {});
  const list = all[curriculumId] || [];
  return list;
}

export function saveLocalEnrollment(curriculumId, studentId, studentInfo = {}) {
  const all = getStored("educanvas_enrollments", {});
  if (!all[curriculumId]) all[curriculumId] = [];
  
  if (!all[curriculumId].some((e) => e.studentId === studentId)) {
    all[curriculumId].push({
      studentId,
      enrolledAt: new Date().toISOString(),
      studentName: studentInfo.name || "Student",
      college: studentInfo.college || "Global University",
    });
    setStored("educanvas_enrollments", all);
  }
}

export function isStudentEnrolledLocally(curriculumId, studentId) {
  const list = getLocalEnrollmentList(curriculumId);
  return list.some((e) => e.studentId === studentId);
}

// 3. Topic Completions
export function getLocalTopicCompletions(studentId, curriculumId) {
  const all = getStored("educanvas_completions", {});
  const userMap = all[studentId] || {};
  return userMap[curriculumId] || {};
}

export function saveLocalTopicCompletion(studentId, curriculumId, topicId) {
  const all = getStored("educanvas_completions", {});
  if (!all[studentId]) all[studentId] = {};
  if (!all[studentId][curriculumId]) all[studentId][curriculumId] = {};
  all[studentId][curriculumId][topicId] = true;
  setStored("educanvas_completions", all);
}

// 4. Action Logs (Teacher / Student History)
export function getLocalHistory(type, uid) {
  const key = `educanvas_history_${type}_${uid}`;
  return getStored(key, []);
}

export function saveLocalHistory(type, uid, entry) {
  const key = `educanvas_history_${type}_${uid}`;
  const list = getStored(key, []);
  const item = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  list.unshift(item);
  setStored(key, list.slice(0, 50));
  return item;
}
