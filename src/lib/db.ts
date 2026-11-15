import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  AcademicDomain,
  AccountRole,
  ActivityLog,
  AdminRoleRecord,
  Announcement,
  ApplicationStatus,
  CareerListing,
  ContactMessage,
  DatabaseStore,
  EnrichedApplication,
  EnrichedInternship,
  EnrichedScholar,
  Internship,
  InternshipApplication,
  NotificationItem,
  PhdScholarProfile,
  Profile,
  Publication,
  ResearchProject,
  SavedScholar,
  ScholarContactRequest,
  Specialization,
  StudentProfile,
  StudentProject,
  SubscriptionPlan,
  SubscriptionTransaction,
  Testimonial,
  UserSubscription,
  WebsiteSettings,
} from "@/types/database";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "starsky-db.json");

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(`starsky_salt_${password}`).digest("hex");
}

function createInitialSeed(): DatabaseStore {
  const now = new Date().toISOString();

  const domains: AcademicDomain[] = [
    {
      id: "dom-engineering",
      name: "Engineering",
      slug: "engineering",
      description:
        "Computing, artificial intelligence, electronics, robotics, mechanical systems, and sustainable infrastructure.",
      icon_name: "Cpu",
      image_url:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80",
      display_order: 1,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "dom-medical",
      name: "Medical and Healthcare",
      slug: "medical-and-healthcare",
      description:
        "Clinical research, pharmacology, neuroscience, medical imaging, bioinformatics, and public health initiatives.",
      icon_name: "Stethoscope",
      image_url:
        "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=80",
      display_order: 2,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "dom-science",
      name: "Science",
      slug: "science",
      description:
        "Fundamental and applied research in physics, chemistry, mathematics, biological sciences, statistics, and ecology.",
      icon_name: "Atom",
      image_url:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80",
      display_order: 3,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "dom-management",
      name: "Management",
      slug: "management",
      description:
        "Organizational strategy, quantitative finance, marketing science, operations research, and business analytics.",
      icon_name: "Briefcase",
      image_url:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
      display_order: 4,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "dom-commerce",
      name: "Commerce",
      slug: "commerce",
      description:
        "Economic policy, corporate governance, international trade, taxation systems, and financial auditing.",
      icon_name: "TrendingUp",
      image_url:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
      display_order: 5,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "dom-arts",
      name: "Arts and Humanities",
      slug: "arts-and-humanities",
      description:
        "Cognitive psychology, computational linguistics, sociology, public policy, literature, and cultural heritage.",
      icon_name: "BookOpen",
      image_url:
        "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=900&q=80",
      display_order: 6,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "dom-law",
      name: "Law",
      slug: "law",
      description:
        "Constitutional jurisprudence, intellectual property, technology & cyber law, corporate law, and human rights.",
      icon_name: "Scale",
      image_url:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80",
      display_order: 7,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "dom-agriculture",
      name: "Agriculture",
      slug: "agriculture",
      description:
        "Agronomy, precision agriculture, plant genetics, soil science, sustainable food systems, and agricultural economics.",
      icon_name: "Sprout",
      image_url:
        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80",
      display_order: 8,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "dom-interdisciplinary",
      name: "Interdisciplinary Research",
      slug: "interdisciplinary-research",
      description:
        "Cross-domain inquiries spanning climate tech, computational social science, neuro-AI, and quantum computing.",
      icon_name: "Network",
      image_url:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80",
      display_order: 9,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const rawSpecializations: Array<{ domain_id: string; items: string[] }> = [
    {
      domain_id: "dom-engineering",
      items: [
        "Computer Science Engineering",
        "Artificial Intelligence and Machine Learning",
        "Data Science",
        "Cybersecurity",
        "Electronics and Communication",
        "Electrical Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
        "Chemical Engineering",
        "Biotechnology",
        "Information Technology",
        "Robotics and Automation",
      ],
    },
    {
      domain_id: "dom-medical",
      items: [
        "General Medicine",
        "Surgery",
        "Pharmacology",
        "Microbiology",
        "Biotechnology",
        "Neuroscience",
        "Public Health",
        "Medical Imaging",
        "Bioinformatics",
      ],
    },
    {
      domain_id: "dom-science",
      items: [
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
        "Statistics",
        "Environmental Science",
      ],
    },
    {
      domain_id: "dom-management",
      items: [
        "Finance",
        "Marketing",
        "Human Resource Management",
        "Operations",
        "Business Analytics",
      ],
    },
    {
      domain_id: "dom-commerce",
      items: [
        "Accounting and Auditing",
        "International Trade",
        "Econometrics",
        "Corporate Governance",
        "Banking and FinTech",
      ],
    },
    {
      domain_id: "dom-arts",
      items: [
        "Cognitive Psychology",
        "Computational Linguistics",
        "Sociology and Development",
        "Public Policy",
        "Modern History and Archives",
      ],
    },
    {
      domain_id: "dom-law",
      items: [
        "Intellectual Property Law",
        "Cyber and Technology Law",
        "Constitutional Law",
        "Environmental Law",
        "International Arbitration",
      ],
    },
    {
      domain_id: "dom-agriculture",
      items: [
        "Precision Agronomy",
        "Plant Breeding and Genetics",
        "Soil and Water Engineering",
        "Horticulture Science",
        "Agricultural Economics",
      ],
    },
    {
      domain_id: "dom-interdisciplinary",
      items: [
        "Climate Systems and Sustainability",
        "Quantum Information Science",
        "Computational Social Science",
        "Biomedical Engineering Systems",
        "AI Ethics and Governance",
      ],
    },
  ];

  const specializations: Specialization[] = [];
  for (const group of rawSpecializations) {
    group.items.forEach((name, idx) => {
      const slug = `${group.domain_id.replace("dom-", "")}-${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}`;
      specializations.push({
        id: `spec-${slug}`,
        domain_id: group.domain_id,
        name,
        slug,
        description: `Focused research programs, publications, and academic mentorship in ${name}.`,
        display_order: idx + 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    });
  }

  // Profiles: 1 Admin, 5 PhD Scholars, 2 Students
  const profiles: Profile[] = [
    {
      id: "usr-admin-1",
      email: "admin@starsky.edu",
      password_hash: hashPassword("Admin@2026"),
      full_name: "Dr. Vikramaditya Sen",
      avatar_url:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      phone: "+91 98450 11223",
      gender: "Male",
      country: "India",
      state: "Karnataka",
      city: "Bengaluru",
      role: "admin",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr-scholar-1",
      email: "ananya.raghavan@iisc.ac.in",
      password_hash: hashPassword("Scholar@2026"),
      full_name: "Ananya Raghavan",
      avatar_url:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80",
      phone: "+91 98801 44510",
      gender: "Female",
      country: "India",
      state: "Karnataka",
      city: "Bengaluru",
      role: "scholar",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr-scholar-2",
      email: "rohan.deshmukh@iitb.ac.in",
      password_hash: hashPassword("Scholar@2026"),
      full_name: "Rohan Deshmukh",
      avatar_url:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80",
      phone: "+91 98201 77890",
      gender: "Male",
      country: "India",
      state: "Maharashtra",
      city: "Mumbai",
      role: "scholar",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr-scholar-3",
      email: "meera.krishnan@aiims.edu",
      password_hash: hashPassword("Scholar@2026"),
      full_name: "Dr. Meera Krishnan",
      avatar_url:
        "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=500&q=80",
      phone: "+91 98112 33901",
      gender: "Female",
      country: "India",
      state: "Delhi",
      city: "New Delhi",
      role: "scholar",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr-scholar-4",
      email: "siddharth.verma@iima.ac.in",
      password_hash: hashPassword("Scholar@2026"),
      full_name: "Siddharth Verma",
      avatar_url:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80",
      phone: "+91 98980 65432",
      gender: "Male",
      country: "India",
      state: "Gujarat",
      city: "Ahmedabad",
      role: "scholar",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr-scholar-5",
      email: "kabir.sen@tifr.res.in",
      password_hash: hashPassword("Scholar@2026"),
      full_name: "Kabir Sen",
      avatar_url:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
      phone: "+91 98214 90811",
      gender: "Male",
      country: "India",
      state: "Maharashtra",
      city: "Mumbai",
      role: "scholar",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr-student-1",
      email: "aarav.sharma@nitk.edu.in",
      password_hash: hashPassword("Student@2026"),
      full_name: "Aarav Sharma",
      avatar_url:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80",
      phone: "+91 97400 12345",
      gender: "Male",
      country: "India",
      state: "Karnataka",
      city: "Surathkal",
      role: "student",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr-student-2",
      email: "diya.nair@vit.ac.in",
      password_hash: hashPassword("Student@2026"),
      full_name: "Diya Nair",
      avatar_url:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80",
      phone: "+91 94440 54321",
      gender: "Female",
      country: "India",
      state: "Tamil Nadu",
      city: "Vellore",
      role: "student",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const phd_scholar_profiles: PhdScholarProfile[] = [
    {
      id: "sch-1",
      profile_id: "usr-scholar-1",
      university_institution: "Indian Institute of Science (IISc), Bengaluru",
      department: "Department of Computer Science and Automation",
      research_field: "Engineering",
      specialization: "Artificial Intelligence and Machine Learning",
      domain_id: "dom-engineering",
      specialization_id: "spec-engineering-artificial-intelligence-and-machine-learning",
      enrollment_year: 2022,
      expected_completion_year: 2027,
      current_research_topic:
        "Interpretable Multimodal Foundation Models for Low-Resource Scientific Discovery",
      biography:
        "Senior Prime Minister's Research Fellow (PMRF) at IISc Bengaluru investigating trustworthy multimodal representation learning and mechanistic interpretability. Passionate about mentoring undergraduate researchers toward top-tier publications (NeurIPS, ICML, ICLR).",
      education_summary:
        "Ph.D. Candidate in Computer Science, IISc Bengaluru (2022–Present) • M.Tech in AI, IIT Hyderabad (Gold Medalist, 2022) • B.Tech in CSE, NIT Tiruchirappalli (2020).",
      research_interests: [
        "Multimodal Deep Learning",
        "Mechanistic Interpretability",
        "Graph Neural Networks",
        "Scientific Machine Learning",
      ],
      technical_skills: ["PyTorch", "JAX", "Python", "CUDA", "Distributed Training", "LaTeX"],
      research_tools: ["Weights & Biases", "HuggingFace", "Slurm HPC", "Docker", "Overleaf"],
      certifications: [
        "Prime Minister's Research Fellowship (PMRF) Awardee",
        "NVIDIA Deep Learning Institute Certified Researcher",
      ],
      google_scholar_url: "https://scholar.google.com",
      orcid_id: "0000-0002-8491-3310",
      linkedin_url: "https://linkedin.com",
      github_url: "https://github.com",
      personal_website_url: "https://iisc.ac.in",
      internship_availability: true,
      verification_status: "approved",
      verified_by: "usr-admin-1",
      verified_at: now,
      profile_views: 428,
      is_featured: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "sch-2",
      profile_id: "usr-scholar-2",
      university_institution: "Indian Institute of Technology (IIT) Bombay",
      department: "Centre for Systems and Control Engineering",
      research_field: "Engineering",
      specialization: "Robotics and Automation",
      domain_id: "dom-engineering",
      specialization_id: "spec-engineering-robotics-and-automation",
      enrollment_year: 2021,
      expected_completion_year: 2026,
      current_research_topic:
        "Distributed Swarm Navigation and Vision-Based SLAM in GPS-Denied Environments",
      biography:
        "Doctoral Researcher at IIT Bombay working on autonomous aerial-ground robotic collectives, non-linear model predictive control, and onboard visual-inertial odometry.",
      education_summary:
        "Ph.D. in Autonomous Robotics, IIT Bombay (2021–Present) • Dual Degree (B.Tech + M.Tech) in Electrical Engineering, IIT Kharagpur (2021).",
      research_interests: [
        "Autonomous Mobile Robots",
        "Visual SLAM",
        "Nonlinear Control",
        "Multi-Agent Reinforcement Learning",
      ],
      technical_skills: ["C++", "ROS2", "Python", "OpenCV", "Eigen", "Gazebo", "Embedded Linux"],
      research_tools: ["ROS2 Humble", "Isaac Sim", "MATLAB/Simulink", "Git", "Pixhawk PX4"],
      certifications: ["IEEE RAS Best Student Paper Finalist 2025"],
      google_scholar_url: "https://scholar.google.com",
      orcid_id: "0000-0003-1920-7741",
      linkedin_url: "https://linkedin.com",
      github_url: "https://github.com",
      personal_website_url: "https://iitb.ac.in",
      internship_availability: true,
      verification_status: "approved",
      verified_by: "usr-admin-1",
      verified_at: now,
      profile_views: 315,
      is_featured: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "sch-3",
      profile_id: "usr-scholar-3",
      university_institution: "All India Institute of Medical Sciences (AIIMS), New Delhi",
      department: "Department of Biophysics & Computational Neuroimaging",
      research_field: "Medical and Healthcare",
      specialization: "Medical Imaging",
      domain_id: "dom-medical",
      specialization_id: "spec-medical-medical-imaging",
      enrollment_year: 2022,
      expected_completion_year: 2026,
      current_research_topic:
        "Early Neurodegenerative Biomarker Detection via 3D Diffusion Tensor MRI and Clinical Genomics",
      biography:
        "Clinical and computational researcher at AIIMS New Delhi combining high-resolution neuroimaging with transcriptomic markers for early-stage Alzheimer's and Parkinson's diagnostics.",
      education_summary:
        "Ph.D. Scholar in Biomedical Imaging & Neuroscience, AIIMS New Delhi • M.Sc. in Biophysics, AIIMS • B.Sc. (Hons) Life Sciences, University of Delhi.",
      research_interests: [
        "Neuroimaging (fMRI / DTI)",
        "Computational Diagnostics",
        "Clinical Biostatistics",
        "Radiomics",
      ],
      technical_skills: ["Python", "MONAI", "3D Slicer", "R", "Biostatistics", "DICOM Processing"],
      research_tools: ["FSL", "FreeSurfer", "ITK-SNAP", "REDCap", "PyTorch"],
      certifications: ["ICMR Senior Research Fellowship (SRF)", "Good Clinical Practice (GCP) Certified"],
      google_scholar_url: "https://scholar.google.com",
      orcid_id: "0000-0001-9982-4412",
      linkedin_url: "https://linkedin.com",
      github_url: "https://github.com",
      personal_website_url: "https://aiims.edu",
      internship_availability: true,
      verification_status: "approved",
      verified_by: "usr-admin-1",
      verified_at: now,
      profile_views: 289,
      is_featured: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "sch-4",
      profile_id: "usr-scholar-4",
      university_institution: "Indian Institute of Management (IIM) Ahmedabad",
      department: "Finance, Accounting & Quantitative Systems",
      research_field: "Management",
      specialization: "Business Analytics",
      domain_id: "dom-management",
      specialization_id: "spec-management-business-analytics",
      enrollment_year: 2023,
      expected_completion_year: 2027,
      current_research_topic:
        "Causal Inference and Algorithmic Pricing Dynamics in Emerging Digital Marketplaces",
      biography:
        "Doctoral Scholar at IIM Ahmedabad researching empirical industrial organization, causal machine learning, and algorithmic market design across e-commerce and fintech ecosystems.",
      education_summary:
        "Ph.D. in Management (Quantitative Systems), IIM Ahmedabad • M.Stat, Indian Statistical Institute (ISI) Kolkata.",
      research_interests: [
        "Causal Inference",
        "Econometrics",
        "Algorithmic Game Theory",
        "Supply Chain Analytics",
      ],
      technical_skills: ["R", "Stata", "Python", "SQL", "CausalML", "Panel Econometrics"],
      research_tools: ["Bloomberg Terminal", "WRDS", "PostgreSQL", "Quarto", "LaTeX"],
      certifications: ["UGC-NET JRF in Economics & Management"],
      google_scholar_url: "https://scholar.google.com",
      orcid_id: "0000-0002-5541-9012",
      linkedin_url: "https://linkedin.com",
      github_url: "https://github.com",
      personal_website_url: "https://iima.ac.in",
      internship_availability: true,
      verification_status: "approved",
      verified_by: "usr-admin-1",
      verified_at: now,
      profile_views: 204,
      is_featured: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "sch-5",
      profile_id: "usr-scholar-5",
      university_institution: "Tata Institute of Fundamental Research (TIFR), Mumbai",
      department: "Department of Condensed Matter Physics and Quantum Information",
      research_field: "Science",
      specialization: "Physics",
      domain_id: "dom-science",
      specialization_id: "spec-science-physics",
      enrollment_year: 2023,
      expected_completion_year: 2028,
      current_research_topic:
        "Decoherence Mitigation and Fault-Tolerant Gate Synthesis in Superconducting Qubit Arrays",
      biography:
        "Doctoral researcher in quantum information processing and open quantum systems at TIFR Mumbai, building numerical tensor-network simulators for NISQ hardware.",
      education_summary:
        "Integrated M.Sc.–Ph.D. in Physics, TIFR Mumbai • B.Sc. (Hons) Physics, St. Stephen's College.",
      research_interests: [
        "Quantum Error Correction",
        "Open Quantum Systems",
        "Tensor Networks",
        "Superconducting Qubits",
      ],
      technical_skills: ["Qiskit", "QuTiP", "Julia", "Python", "C++", "TensorNetwork"],
      research_tools: ["IBM Quantum Composer", "Julia ITensors", "Mathematica", "LaTeX"],
      certifications: ["CSIR-NET JRF All India Rank 14"],
      google_scholar_url: "https://scholar.google.com",
      orcid_id: "0000-0003-8821-1029",
      linkedin_url: "https://linkedin.com",
      github_url: "https://github.com",
      personal_website_url: "https://tifr.res.in",
      internship_availability: true,
      verification_status: "pending",
      profile_views: 94,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
  ];

  const publications: Publication[] = [
    {
      id: "pub-1",
      scholar_profile_id: "sch-1",
      title:
        "Sparse Concept Bottlenecks for Verifiable Multimodal Scientific Reasoning",
      journal_conference: "Advances in Neural Information Processing Systems (NeurIPS)",
      publication_year: 2025,
      doi_or_url: "https://doi.org/10.5555/neurips.2025.0192",
      co_authors: "A. Raghavan, S. Narayanan, P. Bhattacharyya",
      abstract:
        "We introduce a sparse concept-alignment architecture that improves out-of-distribution robustness on scientific benchmarks while providing human-auditable attribution traces.",
      created_at: now,
    },
    {
      id: "pub-2",
      scholar_profile_id: "sch-1",
      title:
        "Equivariant Graph Transformers for Molecular Property Prediction under Data Scarcity",
      journal_conference: "International Conference on Machine Learning (ICML)",
      publication_year: 2024,
      doi_or_url: "https://doi.org/10.5555/icml.2024.0881",
      co_authors: "A. Raghavan, K. Murthy",
      abstract:
        "Demonstrates sample-efficient 3D molecular representation learning using SE(3)-equivariant attention layers.",
      created_at: now,
    },
    {
      id: "pub-3",
      scholar_profile_id: "sch-2",
      title:
        "Decentralized Control Barrier Functions for Agile Quadrotor Swarms in Cluttered Forests",
      journal_conference: "IEEE Transactions on Robotics (T-RO)",
      publication_year: 2025,
      doi_or_url: "https://doi.org/10.1109/TRO.2025.301928",
      co_authors: "R. Deshmukh, A. Chatterjee",
      abstract:
        "Presents a real-time safety-critical control framework guaranteeing collision-free trajectories under communication delays.",
      created_at: now,
    },
    {
      id: "pub-4",
      scholar_profile_id: "sch-3",
      title:
        "Automated White Matter Tractography Segmentation with Self-Supervised 3D Vision Transformers",
      journal_conference: "Medical Image Analysis (Elsevier)",
      publication_year: 2025,
      doi_or_url: "https://doi.org/10.1016/j.media.2025.102941",
      co_authors: "M. Krishnan, R. Sharma, V. K. Singh",
      abstract:
        "Validates a clinical-grade segmentation pipeline across multi-center 3T diffusion MRI cohorts.",
      created_at: now,
    },
    {
      id: "pub-5",
      scholar_profile_id: "sch-4",
      title:
        "Double/Debiased Machine Learning for Dynamic Rebate Optimization in Two-Sided Platforms",
      journal_conference: "Management Science",
      publication_year: 2025,
      doi_or_url: "https://doi.org/10.1287/mnsc.2025.0412",
      co_authors: "S. Verma, T. Sengupta",
      abstract:
        "Establishes heterogeneous treatment effect estimators for platform subsidy interventions.",
      created_at: now,
    },
  ];

  const research_projects: ResearchProject[] = [
    {
      id: "proj-1",
      scholar_profile_id: "sch-1",
      title: "OpenSciLM: Auditable Scientific Literature Synthesis Engine",
      description:
        "Building an open-source benchmark and retrieval-augmented verification pipeline to detect citation hallucinations in LLM-generated literature reviews.",
      status: "ongoing",
      technologies: ["PyTorch", "HuggingFace", "vLLM", "FAISS", "Python"],
      start_year: 2025,
      project_url: "https://github.com",
      created_at: now,
    },
    {
      id: "proj-2",
      scholar_profile_id: "sch-2",
      title: "AeroSwarm-ROS2: Open Hardware Testbed for Multi-UAV Cooperative Mapping",
      description:
        "Developing lightweight onboard C++ ROS2 nodes for collaborative 3D occupancy mapping across heterogeneous micro-aerial vehicles.",
      status: "ongoing",
      technologies: ["ROS2", "C++17", "OpenVINS", "OctoMap"],
      start_year: 2024,
      project_url: "https://github.com",
      created_at: now,
    },
    {
      id: "proj-3",
      scholar_profile_id: "sch-3",
      title: "NeuroScreen-India: Multi-Centric Longitudinal MRI Harmonization",
      description:
        "Standardizing cross-scanner MRI preprocessing protocols to eliminate site-specific batch effects in clinical cohorts.",
      status: "ongoing",
      technologies: ["MONAI", "Python", "NiBabel", "R"],
      start_year: 2024,
      created_at: now,
    },
  ];

  const student_profiles: StudentProfile[] = [
    {
      id: "stu-1",
      profile_id: "usr-student-1",
      college_university: "National Institute of Technology Karnataka (NITK), Surathkal",
      degree: "B.Tech",
      department: "Computer Science and Engineering",
      current_year_semester: "3rd Year (6th Semester)",
      graduation_year: 2027,
      academic_interests: [
        "Machine Learning",
        "Computer Vision",
        "Natural Language Processing",
        "Scientific Computing",
      ],
      preferred_domains: ["Engineering", "Science"],
      skills: ["Python", "PyTorch", "Data Structures", "Linear Algebra", "Git", "Linux"],
      programming_languages: ["Python", "C++", "TypeScript", "SQL"],
      previous_projects:
        "1. Chest X-Ray Pneumonia Classification using Vision Transformers (94.2% test F1-score).\n2. Distributed Key-Value Store in C++ using Raft Consensus.",
      research_experience:
        "Undergraduate Research Assistant at NITK Systems Lab (6 months) working on model quantization for edge devices.",
      certifications: [
        "DeepLearning.AI Machine Learning Specialization",
        "NPTEL Deep Learning (Elite + Gold)",
      ],
      resume_url: "/sample-documents/aarav-sharma-cv.pdf",
      linkedin_url: "https://linkedin.com/in/aarav-sharma-demo",
      github_url: "https://github.com/aarav-sharma-demo",
      portfolio_url: "https://aaravsharma.dev",
      bio: "Third-year CSE undergraduate passionate about interpretable deep learning and computer vision research.",
      created_at: now,
      updated_at: now,
    },
    {
      id: "stu-2",
      profile_id: "usr-student-2",
      college_university: "Vellore Institute of Technology (VIT), Vellore",
      degree: "B.Tech",
      department: "Biotechnology & Bioinformatics",
      current_year_semester: "4th Year (7th Semester)",
      graduation_year: 2026,
      academic_interests: ["Medical Imaging", "Bioinformatics", "Computational Neuroscience"],
      preferred_domains: ["Medical and Healthcare", "Science"],
      skills: ["Python", "R", "Bioconductor", "ImageJ", "MONAI", "Statistical Modeling"],
      programming_languages: ["Python", "R", "Bash"],
      previous_projects:
        "1. Brain Tumor Segmentation on BraTS Dataset using 3D U-Net.\n2. Single-Cell RNA-Seq Differential Expression Pipeline in R.",
      research_experience:
        "Completed a summer project on genomic sequence alignment algorithms.",
      certifications: ["Coursera Genomic Data Science Specialization"],
      resume_url: "/sample-documents/diya-nair-cv.pdf",
      linkedin_url: "https://linkedin.com/in/diya-nair-demo",
      github_url: "https://github.com/diya-nair-demo",
      portfolio_url: "https://diyanair.bio",
      bio: "Final-year Biotechnology student bridging clinical neuroimaging and deep learning diagnostics.",
      created_at: now,
      updated_at: now,
    },
  ];

  const internships: Internship[] = [
    {
      id: "int-1",
      scholar_profile_id: "sch-1",
      domain_id: "dom-engineering",
      specialization_id: "spec-engineering-artificial-intelligence-and-machine-learning",
      title: "Research Intern — Mechanistic Interpretability in Multimodal Vision-Language Models",
      description:
        "Collaborate on dissecting cross-attention circuits in open-weights vision-language models (LLaVA / Qwen-VL) applied to scientific diagram comprehension. Selected interns will design probing benchmarks, run activation patching experiments, and co-author a workshop/conference submission.",
      required_skills: ["Python", "PyTorch", "Transformers", "Linear Algebra", "LaTeX"],
      eligibility_criteria:
        "3rd/4th year B.Tech/B.E. or M.Tech/M.S. students in CS, AI, Data Science, or Mathematics with strong PyTorch fundamentals.",
      duration: "10 Weeks (Summer / Semester Track)",
      available_positions: 2,
      mode: "Hybrid",
      application_deadline: "2027-01-31",
      stipend: "₹15,000 / month + Co-authorship Opportunity",
      status: "Open",
      moderation_status: "approved",
      created_at: now,
      updated_at: now,
    },
    {
      id: "int-2",
      scholar_profile_id: "sch-1",
      domain_id: "dom-engineering",
      specialization_id: "spec-engineering-data-science",
      title: "Research Intern — Graph Neural Networks for Materials & Molecular Discovery",
      description:
        "Implement and benchmark equivariant graph neural networks on crystalline materials datasets. You will work directly on data curation, baseline evaluation, and uncertainty quantification.",
      required_skills: ["Python", "PyTorch Geometric", "Graph Algorithms", "NumPy"],
      eligibility_criteria:
        "Undergraduate or postgraduate students in Engineering or Physical Sciences with experience in deep learning.",
      duration: "12 Weeks",
      available_positions: 2,
      mode: "Remote",
      application_deadline: "2027-02-15",
      stipend: "Academic Credit + Letter of Recommendation",
      status: "Open",
      moderation_status: "approved",
      created_at: now,
      updated_at: now,
    },
    {
      id: "int-3",
      scholar_profile_id: "sch-2",
      domain_id: "dom-engineering",
      specialization_id: "spec-engineering-robotics-and-automation",
      title: "Autonomous Quadrotor Swarm Simulation & ROS2 Control Intern",
      description:
        "Develop and test decentralized obstacle avoidance algorithms in ROS2 Humble and Gazebo/Isaac Sim for multi-UAV indoor exploration.",
      required_skills: ["C++", "ROS2", "Python", "Control Systems", "Linux"],
      eligibility_criteria:
        "2nd to 4th year students in Robotics, ECE, Electrical, Mechanical, or Computer Science Engineering.",
      duration: "8 Weeks",
      available_positions: 3,
      mode: "On-site",
      application_deadline: "2027-01-20",
      stipend: "₹12,000 / month",
      status: "Open",
      moderation_status: "approved",
      created_at: now,
      updated_at: now,
    },
    {
      id: "int-4",
      scholar_profile_id: "sch-3",
      domain_id: "dom-medical",
      specialization_id: "spec-medical-medical-imaging",
      title: "3D Brain MRI Biomarker Segmentation & Clinical Radiomics Research Intern",
      description:
        "Work on self-supervised 3D Vision Transformers using the MONAI framework to segment white-matter hyperintensities from longitudinal clinical MRI scans.",
      required_skills: ["Python", "MONAI / PyTorch", "Medical Image Processing", "Biostatistics"],
      eligibility_criteria:
        "Students in Biomedical Engineering, Biotechnology, Bioinformatics, Medical Sciences, or Computer Science.",
      duration: "12 Weeks",
      available_positions: 2,
      mode: "Remote",
      application_deadline: "2027-02-28",
      stipend: "₹10,000 / month + Publication Co-authorship",
      status: "Open",
      moderation_status: "approved",
      created_at: now,
      updated_at: now,
    },
    {
      id: "int-5",
      scholar_profile_id: "sch-4",
      domain_id: "dom-management",
      specialization_id: "spec-management-business-analytics",
      title: "Causal Machine Learning & Econometric Modeling Research Intern",
      description:
        "Assist in empirical data analysis of large-scale marketplace pricing experiments using Double/Debiased ML and panel econometric methods in R and Python.",
      required_skills: ["R", "Python", "Econometrics", "SQL", "Statistical Inference"],
      eligibility_criteria:
        "Students in Management, Economics, Statistics, Commerce, or Data Science with strong quantitative coursework.",
      duration: "8 Weeks",
      available_positions: 2,
      mode: "Remote",
      application_deadline: "2027-02-10",
      stipend: "₹12,500 / month",
      status: "Open",
      moderation_status: "approved",
      created_at: now,
      updated_at: now,
    },
  ];

  const internship_applications: InternshipApplication[] = [
    {
      id: "app-1",
      internship_id: "int-1",
      student_profile_id: "stu-1",
      scholar_profile_id: "sch-1",
      student_full_name: "Aarav Sharma",
      student_email: "aarav.sharma@nitk.edu.in",
      student_phone: "+91 97400 12345",
      college_university: "National Institute of Technology Karnataka (NITK), Surathkal",
      degree: "B.Tech",
      department: "Computer Science and Engineering",
      current_academic_year: "3rd Year (6th Semester)",
      research_interests: ["Mechanistic Interpretability", "Multimodal Learning", "Computer Vision"],
      technical_skills: ["Python", "PyTorch", "Transformers", "CUDA", "LaTeX"],
      statement_of_purpose:
        "I have closely followed your NeurIPS 2025 paper on Sparse Concept Bottlenecks and implemented activation patching experiments on ViT-B/16. Joining this research internship will allow me to contribute rigorously to multimodal circuit analysis.",
      relevant_experience:
        "6 months as Undergraduate Research Assistant at NITK Systems Lab; trained Vision Transformer baselines and authored reproducible PyTorch evaluation suites.",
      expected_availability: "25 hours/week during semester; 40 hours/week during vacation",
      preferred_duration: "10 Weeks",
      resume_url: "/sample-documents/aarav-sharma-cv.pdf",
      portfolio_url: "https://aaravsharma.dev",
      linkedin_url: "https://linkedin.com/in/aarav-sharma-demo",
      additional_message: "Happy to share my GitHub repository with attention rollout visualizations.",
      status: "Shortlisted",
      scholar_private_notes:
        "Strong PyTorch background and already familiar with concept bottleneck literature. Scheduled technical discussion.",
      is_reported: false,
      submitted_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: "app-2",
      internship_id: "int-4",
      student_profile_id: "stu-2",
      scholar_profile_id: "sch-3",
      student_full_name: "Diya Nair",
      student_email: "diya.nair@vit.ac.in",
      student_phone: "+91 94440 54321",
      college_university: "Vellore Institute of Technology (VIT), Vellore",
      degree: "B.Tech",
      department: "Biotechnology & Bioinformatics",
      current_academic_year: "4th Year (7th Semester)",
      research_interests: ["Medical Imaging", "3D MRI Segmentation", "Neuroscience"],
      technical_skills: ["Python", "MONAI", "R", "NiBabel", "3D U-Net"],
      statement_of_purpose:
        "My senior capstone focuses on 3D volumetric brain MRI segmentation on the BraTS dataset. Working under Dr. Meera Krishnan on diffusion tensor MRI biomarkers directly aligns with my postgraduate research goals.",
      relevant_experience:
        "Implemented 3D U-Net and Swin-UNETR pipelines in MONAI with Dice score 0.89 on multi-modal brain MRI.",
      expected_availability: "30 hours/week starting immediately",
      preferred_duration: "12 Weeks",
      resume_url: "/sample-documents/diya-nair-cv.pdf",
      portfolio_url: "https://diyanair.bio",
      linkedin_url: "https://linkedin.com/in/diya-nair-demo",
      additional_message: "Available for remote collaboration across all clinical biostatistics tasks.",
      status: "Submitted",
      scholar_private_notes: "",
      is_reported: false,
      submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  const saved_scholars: SavedScholar[] = [
    {
      id: "sav-1",
      student_profile_id: "stu-1",
      scholar_profile_id: "sch-1",
      created_at: now,
    },
    {
      id: "sav-2",
      student_profile_id: "stu-1",
      scholar_profile_id: "sch-2",
      created_at: now,
    },
  ];

  const career_listings: CareerListing[] = [
    {
      id: "car-1",
      title: "University Partnerships & Academic Outreach Lead",
      department: "Institutional Relations",
      location: "Bengaluru / Hybrid",
      employment_type: "Full-time",
      description:
        "Partner with Deans of Research, Doctoral Councils, and Innovation Cells across premier universities to onboard verified PhD scholars and research labs onto STARSKY.",
      requirements: [
        "Master's degree or PhD familiarity with higher-education ecosystems",
        "3+ years experience in academic program management or ed-tech partnerships",
        "Strong communication skills with faculty and research scholars",
      ],
      application_email: "careers@starsky.edu",
      is_published: true,
      closing_date: "2027-03-31",
      created_at: now,
      updated_at: now,
    },
    {
      id: "car-2",
      title: "Full-Stack Platform Engineer (Next.js & PostgreSQL)",
      department: "Platform Engineering",
      location: "Remote (India)",
      employment_type: "Full-time",
      description:
        "Architect and scale STARSKY's research discovery, scholar verification, and collaborative mentorship workflows using Next.js, TypeScript, and Supabase PostgreSQL.",
      requirements: [
        "Strong proficiency in TypeScript, React, Next.js App Router, and PostgreSQL",
        "Experience designing secure role-based access control and RLS policies",
        "Passion for building tools for the scientific and academic community",
      ],
      application_email: "careers@starsky.edu",
      is_published: true,
      closing_date: "2027-04-15",
      created_at: now,
      updated_at: now,
    },
  ];

  const contact_messages: ContactMessage[] = [
    {
      id: "msg-1",
      name: "Prof. Arvind Subramanian",
      email: "dean.research@nitw.ac.in",
      subject: "Institutional MoU for Doctoral Mentorship Program",
      message:
        "We would like to explore onboarding 45 doctoral scholars from NIT Warangal across Engineering and Sciences onto STARSKY for our upcoming summer undergraduate research fellowship.",
      status: "unread",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const testimonials: Testimonial[] = [
    {
      id: "test-1",
      author_name: "Aarav Sharma",
      author_role: "B.Tech CSE Undergraduate",
      institution: "NIT Karnataka, Surathkal",
      quote:
        "Before STARSKY, cold-emailing professors rarely got responses. Through STARSKY, I connected directly with a PMRF PhD scholar at IISc Bengaluru and contributed to a NeurIPS workshop submission.",
      avatar_url:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
      rating: 5,
      is_featured: true,
      display_order: 1,
      created_at: now,
    },
    {
      id: "test-2",
      author_name: "Ananya Raghavan",
      author_role: "PhD Scholar (PMRF)",
      institution: "IISc Bengaluru",
      quote:
        "STARSKY helped me find motivated undergraduate interns with the exact PyTorch and linear algebra skills needed for our multimodal interpretability experiments—saving weeks of screening.",
      avatar_url:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      rating: 5,
      is_featured: true,
      display_order: 2,
      created_at: now,
    },
    {
      id: "test-3",
      author_name: "Dr. Meera Krishnan",
      author_role: "Doctoral Researcher in Neuroimaging",
      institution: "AIIMS New Delhi",
      quote:
        "Interdisciplinary medical research requires students from both life sciences and computer science. STARSKY's structured domain taxonomy makes cross-disciplinary collaboration effortless.",
      avatar_url:
        "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=300&q=80",
      rating: 5,
      is_featured: true,
      display_order: 3,
      created_at: now,
    },
  ];

  const announcements: Announcement[] = [
    {
      id: "ann-1",
      title: "2027 Summer & Semester Research Internship Applications Now Open",
      content:
        "Explore verified PhD scholars across 9 academic domains and apply early for remote, hybrid, and on-site research mentorship positions.",
      audience: "all",
      priority: "important",
      is_active: true,
      created_at: now,
    },
  ];

  const website_settings: WebsiteSettings = {
    id: "settings-1",
    site_name: "STARSKY",
    tagline: "Connecting Research Minds. Creating Opportunities.",
    logo_text: "STARSKY",
    hero_heading: "Where Student Ambitions Meet Research Excellence.",
    hero_description:
      "Discover research opportunities, connect with experienced PhD scholars, and turn your academic curiosity into real-world research experience.",
    hero_image_url:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=85",
    about_title: "Bridging Academic Curiosity and Doctoral Research Mentorship",
    about_content:
      "STARSKY was founded to solve a fundamental disconnect in higher education: thousands of PhD scholars possess deep domain expertise in experimental design, scientific computing, clinical analysis, and academic publishing, while ambitious undergraduate and postgraduate students struggle to find structured research guidance beyond their immediate classrooms. STARSKY creates a verified, transparent bridge where scholars mentor capable student collaborators on real-world research problems.",
    mission_statement:
      "To democratize access to high-impact academic research mentorship by connecting motivated undergraduate and postgraduate students with verified PhD scholars across every discipline.",
    vision_statement:
      "A global academic ecosystem where every curious student can contribute to frontier research and every doctoral scholar can build agile, collaborative research teams.",
    contact_email: "contact@starsky.edu",
    contact_phone: "+91 (800) 555-0199",
    contact_address: "STARSKY Academic Innovation Hub, Research Park, Bengaluru 560012, India",
    footer_text:
      "STARSKY is a dedicated academic research collaboration and internship discovery platform connecting verified PhD scholars with undergraduate and postgraduate students.",
    social_links: {
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
      github: "https://github.com",
    },
    seo_title: "STARSKY — Connecting Research Minds. Creating Opportunities.",
    seo_description:
      "Discover research internships and mentorship under verified PhD scholars across Engineering, Medicine, Science, Management, Law, and Humanities.",
    maintenance_mode: false,
    allow_registrations: true,
    allow_student_registrations: true,
    allow_scholar_registrations: true,
    enable_email_notifications: true,
    updated_at: now,
  };

  const admin_roles: AdminRoleRecord[] = [
    {
      id: "adm-role-1",
      profile_id: "usr-admin-1",
      role_title: "Chief Platform Administrator",
      is_super_admin: true,
      permissions: [
        "manage_users",
        "verify_scholars",
        "manage_domains",
        "manage_internships",
        "manage_applications",
        "manage_cms",
        "manage_settings",
        "manage_admins",
      ],
      created_at: now,
    },
  ];

  const activity_logs: ActivityLog[] = [
    {
      id: "log-1",
      actor_profile_id: "usr-admin-1",
      actor_name: "Dr. Vikramaditya Sen",
      actor_role: "admin",
      action: "Verified PhD Scholar Profile",
      entity_type: "phd_scholar_profiles",
      entity_id: "sch-1",
      details: "Verified institutional credentials for Ananya Raghavan (IISc Bengaluru).",
      created_at: now,
    },
    {
      id: "log-2",
      actor_profile_id: "usr-student-1",
      actor_name: "Aarav Sharma",
      actor_role: "student",
      action: "Submitted Internship Application",
      entity_type: "internship_applications",
      entity_id: "app-1",
      details: "Applied for Mechanistic Interpretability in Multimodal Vision-Language Models.",
      created_at: now,
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: "notif-1",
      recipient_profile_id: "usr-student-1",
      title: "Application Shortlisted",
      message:
        "Your application for 'Research Intern — Mechanistic Interpretability in Multimodal Vision-Language Models' with Ananya Raghavan has been shortlisted!",
      type: "success",
      link_url: "/dashboard/student/applications",
      is_read: false,
      created_at: now,
    },
    {
      id: "notif-2",
      recipient_profile_id: "usr-scholar-1",
      title: "New Research Internship Application",
      message:
        "Aarav Sharma (NITK Surathkal) submitted an application for 'Research Intern — Mechanistic Interpretability in Multimodal Vision-Language Models'.",
      type: "info",
      link_url: "/dashboard/scholar/applications",
      is_read: false,
      created_at: now,
    },
    {
      id: "notif-3",
      recipient_profile_id: "usr-scholar-3",
      title: "New Research Internship Application",
      message:
        "Diya Nair (VIT Vellore) applied for '3D Brain MRI Biomarker Segmentation & Clinical Radiomics Research Intern'.",
      type: "info",
      link_url: "/dashboard/scholar/applications",
      is_read: false,
      created_at: now,
    },
    {
      id: "notif-4",
      recipient_profile_id: "usr-admin-1",
      title: "Pending PhD Scholar Verification",
      message:
        "Kabir Sen (TIFR Mumbai) registered as a PhD Scholar and is awaiting credential verification.",
      type: "warning",
      link_url: "/admin/scholars",
      is_read: false,
      created_at: now,
    },
    {
      id: "notif-5",
      recipient_profile_id: "usr-admin-1",
      title: "New Institutional Inquiry Received",
      message:
        "Prof. Arvind Subramanian submitted a contact message regarding an Institutional MoU.",
      type: "info",
      link_url: "/admin/messages",
      is_read: false,
      created_at: now,
    },
  ];

  return {
    profiles,
    student_profiles,
    student_projects: [],
    phd_scholar_profiles,
    academic_domains: domains,
    specializations,
    publications,
    research_projects,
    internships,
    internship_applications,
    saved_scholars,
    subscription_plans: createDefaultSubscriptionPlans(now),
    user_subscriptions: [],
    subscription_transactions: [],
    scholar_contact_requests: [],
    career_listings,
    contact_messages,
    testimonials,
    announcements,
    website_settings: {
      ...website_settings,
      enable_premium_system: true,
      free_scholar_limit: 5,
    },
    admin_roles,
    activity_logs,
    notifications,
  };
}

function createDefaultSubscriptionPlans(now: string): SubscriptionPlan[] {
  return [
    {
      id: "plan-monthly",
      name: "Monthly Research Explorer",
      billing_cycle: "monthly",
      price: 499,
      currency: "INR",
      duration_days: 30,
      description:
        "Ideal for students actively exploring summer or semester research internships.",
      features: [
        "Full access to all verified PhD scholar profiles",
        "Advanced search & filtering across all 9 academic domains",
        "Direct PhD Scholar Contact & research inquiry messaging",
        "Priority visibility on internship applications",
      ],
      is_active: true,
      is_popular: false,
      display_order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: "plan-quarterly",
      name: "Quarterly Scholar Network",
      billing_cycle: "quarterly",
      price: 1199,
      currency: "INR",
      duration_days: 90,
      description:
        "Most popular choice for semester-long mentorship discovery and multi-lab networking.",
      features: [
        "Full access to all verified PhD scholar profiles",
        "Advanced researcher discovery & specialization filters",
        "Direct PhD Scholar Contact & messaging",
        "Expanded research networking opportunities",
        "Save 20% compared to monthly billing",
      ],
      is_active: true,
      is_popular: true,
      display_order: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: "plan-yearly",
      name: "Annual Academic Pro",
      billing_cycle: "yearly",
      price: 3499,
      currency: "INR",
      duration_days: 365,
      description:
        "Year-round access for dedicated undergraduate and postgraduate researchers building publication portfolios.",
      features: [
        "Unlimited year-round PhD scholar directory access",
        "Unlimited direct scholar contact requests",
        "Advanced cross-disciplinary researcher discovery",
        "Long-term thesis & publication collaboration access",
        "Save over 40% with annual academic pricing",
      ],
      is_active: true,
      is_popular: false,
      display_order: 3,
      created_at: now,
      updated_at: now,
    },
  ];
}

function ensureAdditionalApprovedScholars(store: DatabaseStore, now: string): boolean {
  let mutated = false;

  // Ensure sch-5 (Kabir Sen, TIFR Mumbai) is approved if present so the first 5 scholars are approved
  const sch5 = store.phd_scholar_profiles.find((s) => s.id === "sch-5");
  if (sch5 && sch5.verification_status !== "approved") {
    sch5.verification_status = "approved";
    sch5.verified_by = "usr-admin-1";
    sch5.verified_at = now;
    sch5.is_featured = true;
    mutated = true;
  }

  const additionalProfiles: Profile[] = [
    {
      id: "usr-scholar-6",
      email: "nitya.balasubramanian@iitm.ac.in",
      password_hash: hashPassword("Scholar@2026"),
      full_name: "Dr. Nitya Balasubramanian",
      avatar_url:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80",
      phone: "+91 94451 88210",
      gender: "Female",
      country: "India",
      state: "Tamil Nadu",
      city: "Chennai",
      role: "scholar",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr-scholar-7",
      email: "arjun.chatterjee@nls.ac.in",
      password_hash: hashPassword("Scholar@2026"),
      full_name: "Arjun Chatterjee",
      avatar_url:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
      phone: "+91 98452 77319",
      gender: "Male",
      country: "India",
      state: "Karnataka",
      city: "Bengaluru",
      role: "scholar",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr-scholar-8",
      email: "priya.shekhawat@iari.res.in",
      password_hash: hashPassword("Scholar@2026"),
      full_name: "Priya Shekhawat",
      avatar_url:
        "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=500&q=80",
      phone: "+91 98109 64230",
      gender: "Female",
      country: "India",
      state: "Delhi",
      city: "New Delhi",
      role: "scholar",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const additionalScholars: PhdScholarProfile[] = [
    {
      id: "sch-6",
      profile_id: "usr-scholar-6",
      university_institution: "Indian Institute of Technology (IIT) Madras",
      department: "Department of Electrical Engineering & Cyber-Physical Security",
      highest_qualification: "M.Tech",
      research_field: "Engineering",
      specialization: "Cybersecurity",
      domain_id: "dom-engineering",
      specialization_id: "spec-engineering-cybersecurity",
      enrollment_year: 2022,
      expected_completion_year: 2026,
      current_research_topic:
        "Post-Quantum Lattice-Based Cryptography and Side-Channel Resilient Hardware Accelerators",
      biography:
        "Doctoral researcher at IIT Madras designing side-channel resistant post-quantum cryptographic primitives (CRYSTALS-Kyber / Dilithium) on RISC-V SoCs and FPGA architectures.",
      education_summary:
        "Ph.D. in Electrical Engineering, IIT Madras • M.Tech in Microelectronics & VLSI, IIT Madras.",
      research_interests: [
        "Post-Quantum Cryptography",
        "Hardware Security",
        "Side-Channel Analysis",
        "RISC-V SoC Design",
      ],
      technical_skills: ["Verilog", "SystemVerilog", "C", "Python", "Vivado", "Cryptography"],
      research_tools: ["Xilinx Vivado", "ChipWhisperer", "SageMath", "Verilator", "Git"],
      certifications: ["Qualcomm Innovation Fellowship India Finalist"],
      google_scholar_url: "https://scholar.google.com",
      orcid_id: "0000-0002-7192-4410",
      linkedin_url: "https://linkedin.com",
      github_url: "https://github.com",
      personal_website_url: "https://iitm.ac.in",
      internship_availability: true,
      verification_status: "approved",
      verified_by: "usr-admin-1",
      verified_at: now,
      profile_views: 192,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: "sch-7",
      profile_id: "usr-scholar-7",
      university_institution: "National Law School of India University (NLSIU), Bengaluru",
      department: "Centre for Technology, Law and Policy",
      highest_qualification: "M.Phil",
      research_field: "Law",
      specialization: "Cyber and Technology Law",
      domain_id: "dom-law",
      specialization_id: "spec-law-cyber-and-technology-law",
      enrollment_year: 2023,
      expected_completion_year: 2027,
      current_research_topic:
        "Algorithmic Accountability, Cross-Border Data Sovereignty, and Liability Frameworks for Frontier AI Systems",
      biography:
        "Doctoral fellow at NLSIU Bengaluru examining comparative AI regulation, digital competition law, and constitutional privacy safeguards across the EU AI Act and Digital Personal Data Protection regimes.",
      education_summary:
        "Ph.D. in Technology Law, NLSIU Bengaluru • LL.M. in Law & Technology, NUJS Kolkata.",
      research_interests: [
        "AI Governance & Regulation",
        "Data Privacy Law",
        "Intellectual Property in Generative AI",
        "Digital Competition Policy",
      ],
      technical_skills: [
        "Legal Empirical Research",
        "Comparative Jurisprudence",
        "Policy Drafting",
        "Statutory Interpretation",
      ],
      research_tools: ["SCC Online", "HeinOnline", "Westlaw", "Zotero", "NVivo"],
      certifications: ["UGC-NET JRF in Law"],
      google_scholar_url: "https://scholar.google.com",
      orcid_id: "0000-0001-6320-8815",
      linkedin_url: "https://linkedin.com",
      github_url: "",
      personal_website_url: "https://nls.ac.in",
      internship_availability: true,
      verification_status: "approved",
      verified_by: "usr-admin-1",
      verified_at: now,
      profile_views: 164,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: "sch-8",
      profile_id: "usr-scholar-8",
      university_institution: "ICAR — Indian Agricultural Research Institute (IARI), New Delhi",
      department: "Division of Agricultural Physics & Precision Agronomy",
      highest_qualification: "M.Sc.",
      research_field: "Agriculture",
      specialization: "Precision Agronomy",
      domain_id: "dom-agriculture",
      specialization_id: "spec-agriculture-precision-agronomy",
      enrollment_year: 2022,
      expected_completion_year: 2026,
      current_research_topic:
        "Hyperspectral UAV Remote Sensing and Crop Evapotranspiration Modeling for Climate-Resilient Wheat Cultivars",
      biography:
        "Doctoral researcher at ICAR-IARI integrating multispectral drone imagery, Sentinel-2 satellite telemetry, and machine learning crop-yield forecasting for sustainable water management.",
      education_summary:
        "Ph.D. in Precision Agronomy, ICAR-IARI New Delhi • M.Sc. Agronomy, GBPUAT Pantnagar.",
      research_interests: [
        "Hyperspectral Remote Sensing",
        "Crop Yield Modeling",
        "Agro-Climatic Resilience",
        "Soil Moisture Telemetry",
      ],
      technical_skills: ["Google Earth Engine", "QGIS", "Python", "R", "Spatial Econometrics"],
      research_tools: ["QGIS", "ArcGIS Pro", "Google Earth Engine", "RStudio", " Pix4D"],
      certifications: ["ICAR Senior Research Fellowship (SRF) Rank 3"],
      google_scholar_url: "https://scholar.google.com",
      orcid_id: "0000-0003-4119-5508",
      linkedin_url: "https://linkedin.com",
      github_url: "https://github.com",
      personal_website_url: "https://iari.res.in",
      internship_availability: true,
      verification_status: "approved",
      verified_by: "usr-admin-1",
      verified_at: now,
      profile_views: 178,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
  ];

  for (const prof of additionalProfiles) {
    if (!store.profiles.some((p) => p.id === prof.id || p.email === prof.email)) {
      store.profiles.push(prof);
      mutated = true;
    }
  }

  for (const sch of additionalScholars) {
    if (!store.phd_scholar_profiles.some((s) => s.id === sch.id)) {
      store.phd_scholar_profiles.push(sch);
      mutated = true;
    }
  }

  return mutated;
}

function migrateLegacyStudentProjects(store: DatabaseStore, now: string): boolean {
  let mutated = false;
  if (!Array.isArray(store.student_projects)) {
    store.student_projects = [];
    mutated = true;
  }

  for (const st of store.student_profiles) {
    const existingForStudent = store.student_projects.filter(
      (p) => p.student_id === st.id || p.student_id === st.profile_id
    );
    if (existingForStudent.length === 0 && st.previous_projects && st.previous_projects.trim()) {
      // Split numbered lines or paragraphs into structured project cards without losing any data
      const rawLines = st.previous_projects
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      rawLines.forEach((line, idx) => {
        const cleaned = line.replace(/^\d+[\.\)]\s*/, "");
        const [firstPart, ...rest] = cleaned.split(/\s+using\s+|\s*[-—:]\s*/i);
        const title =
          firstPart && firstPart.length >= 3
            ? firstPart.slice(0, 100)
            : `Academic Project ${idx + 1}`;
        const description = cleaned;
        const technologies = rest.length > 0 ? rest.join(", ") : st.skills.slice(0, 3).join(", ");
        store.student_projects.push({
          id: `stu-proj-${st.id}-${idx + 1}`,
          student_id: st.id,
          title,
          description,
          technologies,
          project_url: st.portfolio_url || "",
          github_url: st.github_url || "",
          duration: "",
          created_at: st.created_at || now,
          updated_at: now,
        });
      });
      mutated = true;
    }
    st.projects = store.student_projects.filter(
      (p) => p.student_id === st.id || p.student_id === st.profile_id
    );
  }

  return mutated;
}

function ensureDbMigrations(store: DatabaseStore): DatabaseStore {
  const now = new Date().toISOString();
  let mutated = false;

  if (!Array.isArray(store.subscription_plans) || store.subscription_plans.length === 0) {
    store.subscription_plans = createDefaultSubscriptionPlans(now);
    mutated = true;
  }

  if (!Array.isArray(store.user_subscriptions)) {
    store.user_subscriptions = [];
    mutated = true;
  }

  if (!Array.isArray(store.subscription_transactions)) {
    store.subscription_transactions = [];
    mutated = true;
  }

  if (!Array.isArray(store.scholar_contact_requests)) {
    store.scholar_contact_requests = [];
    mutated = true;
  }

  if (store.website_settings) {
    if (store.website_settings.enable_premium_system === undefined) {
      store.website_settings.enable_premium_system = true;
      mutated = true;
    }
    if (store.website_settings.free_scholar_limit === undefined) {
      store.website_settings.free_scholar_limit = 5;
      mutated = true;
    }
  }

  if (ensureAdditionalApprovedScholars(store, now)) {
    mutated = true;
  }

  if (migrateLegacyStudentProjects(store, now)) {
    mutated = true;
  }

  // Automatically expire any active subscription whose expiry_date has passed
  const nowMs = Date.now();
  for (const sub of store.user_subscriptions) {
    if (sub.status === "active" && new Date(sub.expiry_date).getTime() <= nowMs) {
      sub.status = "expired";
      sub.updated_at = now;
      mutated = true;
    }
  }

  if (mutated) {
    writeDb(store);
  }

  return store;
}

export function readDb(): DatabaseStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = ensureDbMigrations(createInitialSeed());
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseStore;
    return ensureDbMigrations(parsed);
  } catch {
    const initial = ensureDbMigrations(createInitialSeed());
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

export function writeDb(store: DatabaseStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function createNotification(
  store: DatabaseStore,
  params: {
    recipient_profile_id: string;
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    link_url?: string;
  }
): NotificationItem {
  const item: NotificationItem = {
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    recipient_profile_id: params.recipient_profile_id,
    title: params.title,
    message: params.message,
    type: params.type || "info",
    link_url: params.link_url,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  store.notifications.unshift(item);
  return item;
}

export function logActivity(
  store: DatabaseStore,
  params: {
    actor_profile_id?: string;
    actor_name: string;
    actor_role: AccountRole | "system" | "visitor";
    action: string;
    entity_type: string;
    entity_id?: string;
    details: string;
  }
): ActivityLog {
  const entry: ActivityLog = {
    id: `log-${crypto.randomUUID().slice(0, 8)}`,
    actor_profile_id: params.actor_profile_id,
    actor_name: params.actor_name,
    actor_role: params.actor_role,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    details: params.details,
    created_at: new Date().toISOString(),
  };
  store.activity_logs.unshift(entry);
  return entry;
}

export function sanitizePublicScholarProfile(profile: Profile): Profile {
  const { password_hash: _unused, ...safe } = profile;
  void _unused;
  return {
    ...safe,
    phone: "",
    email: "",
  };
}

export function getActiveStudentSubscription(
  db: DatabaseStore,
  studentUserId: string
): UserSubscription | null {
  const nowMs = Date.now();
  const matching = (db.user_subscriptions || [])
    .filter((s) => s.student_id === studentUserId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const active = matching.find(
    (s) => s.status === "active" && new Date(s.expiry_date).getTime() > nowMs
  );
  if (active) return active;
  return matching[0] || null;
}

export function hasActivePremiumAccess(
  db: DatabaseStore,
  userProfileId?: string,
  userRole?: AccountRole
): boolean {
  if (db.website_settings && db.website_settings.enable_premium_system === false) {
    return true;
  }
  if (!userProfileId || !userRole) {
    return false;
  }
  if (userRole === "admin" || userRole === "scholar") {
    return true;
  }
  const nowMs = Date.now();
  return (db.user_subscriptions || []).some(
    (s) =>
      s.student_id === userProfileId &&
      s.status === "active" &&
      new Date(s.expiry_date).getTime() > nowMs
  );
}

export function getStudentProjects(db: DatabaseStore, studentProfileId: string): StudentProject[] {
  return (db.student_projects || []).filter((p) => p.student_id === studentProfileId);
}

export function getEnrichedScholars(onlyApproved = true): EnrichedScholar[] {
  const db = readDb();
  return db.phd_scholar_profiles
    .filter((s) => !onlyApproved || s.verification_status === "approved")
    .map((scholar) => {
      const rawProfile = db.profiles.find((p) => p.id === scholar.profile_id);
      const profile = rawProfile
        ? onlyApproved
          ? sanitizePublicScholarProfile(rawProfile)
          : (sanitizeProfile(rawProfile) as Profile)
        : undefined!;
      const domain = db.academic_domains.find((d) => d.id === scholar.domain_id);
      const specializationObj = db.specializations.find((sp) => sp.id === scholar.specialization_id);
      const publications = db.publications.filter((p) => p.scholar_profile_id === scholar.id);
      const projects = db.research_projects.filter((p) => p.scholar_profile_id === scholar.id);
      const internships = db.internships.filter(
        (i) =>
          i.scholar_profile_id === scholar.id &&
          (!onlyApproved || (i.status === "Open" && i.moderation_status === "approved"))
      );
      return {
        scholar,
        profile,
        domain,
        specializationObj,
        publications,
        projects,
        internships,
      };
    })
    .filter((item) => Boolean(item.profile && item.profile.status === "active" && !item.profile.deleted_at));
}

export function getEnrichedScholarById(scholarId: string, includeUnapproved = false): EnrichedScholar | null {
  const db = readDb();
  const scholar = db.phd_scholar_profiles.find((s) => s.id === scholarId);
  if (!scholar) return null;
  if (!includeUnapproved && scholar.verification_status !== "approved") return null;

  const rawProfile = db.profiles.find((p) => p.id === scholar.profile_id);
  if (!rawProfile || rawProfile.deleted_at) return null;
  const profile = includeUnapproved
    ? (sanitizeProfile(rawProfile) as Profile)
    : sanitizePublicScholarProfile(rawProfile);

  const domain = db.academic_domains.find((d) => d.id === scholar.domain_id);
  const specializationObj = db.specializations.find((sp) => sp.id === scholar.specialization_id);
  const publications = db.publications.filter((p) => p.scholar_profile_id === scholar.id);
  const projects = db.research_projects.filter((p) => p.scholar_profile_id === scholar.id);
  const internships = db.internships.filter(
    (i) =>
      i.scholar_profile_id === scholar.id &&
      (includeUnapproved || (i.status === "Open" && i.moderation_status === "approved"))
  );

  return {
    scholar,
    profile,
    domain,
    specializationObj,
    publications,
    projects,
    internships,
  };
}

export function getEnrichedInternships(onlyPublic = true): EnrichedInternship[] {
  const db = readDb();
  return db.internships
    .filter((i) => !onlyPublic || (i.status === "Open" && i.moderation_status === "approved"))
    .map((internship) => {
      const scholar = db.phd_scholar_profiles.find((s) => s.id === internship.scholar_profile_id)!;
      const rawUser = scholar ? db.profiles.find((p) => p.id === scholar.profile_id) : undefined;
      const scholarUser = rawUser
        ? onlyPublic
          ? sanitizePublicScholarProfile(rawUser)
          : (sanitizeProfile(rawUser) as Profile)
        : (undefined as unknown as Profile);
      const domain = db.academic_domains.find((d) => d.id === internship.domain_id);
      const specialization = db.specializations.find((sp) => sp.id === internship.specialization_id);
      return {
        internship,
        scholar,
        scholarUser,
        domain,
        specialization,
      };
    })
    .filter(
      (item) =>
        Boolean(item.scholar && item.scholarUser && item.scholarUser.status === "active") &&
        (!onlyPublic || item.scholar.verification_status === "approved")
    );
}

export function getEnrichedApplications(): EnrichedApplication[] {
  const db = readDb();
  return db.internship_applications
    .map((application) => {
      const internship = db.internships.find((i) => i.id === application.internship_id)!;
      const scholar = db.phd_scholar_profiles.find((s) => s.id === application.scholar_profile_id)!;
      const rawScholarUser = scholar ? db.profiles.find((p) => p.id === scholar.profile_id) : undefined;
      const scholarUser = rawScholarUser
        ? (sanitizeProfile(rawScholarUser) as Profile)
        : (undefined as unknown as Profile);
      const student = db.student_profiles.find((st) => st.id === application.student_profile_id)!;
      const rawStudentUser = student ? db.profiles.find((p) => p.id === student.profile_id) : undefined;
      const studentUser = rawStudentUser
        ? (sanitizeProfile(rawStudentUser) as Profile)
        : (undefined as unknown as Profile);
      return {
        application,
        internship,
        scholar,
        scholarUser,
        student,
        studentUser,
      };
    })
    .filter((item) => Boolean(item.internship && item.scholar && item.student));
}

export function getStudentApplicationMap(
  studentUserId?: string
): Record<string, EnrichedApplication> {
  if (!studentUserId) return {};
  const db = readDb();
  const student = db.student_profiles.find((s) => s.profile_id === studentUserId);
  if (!student) return {};

  const allEnriched = getEnrichedApplications().filter(
    (item) => item.application.student_profile_id === student.id
  );

  const map: Record<string, EnrichedApplication> = {};
  for (const item of allEnriched) {
    const safeItem: EnrichedApplication = {
      ...item,
      scholarUser: sanitizePublicScholarProfile(item.scholarUser),
      application: {
        ...item.application,
        scholar_private_notes: "",
      },
    };
    const intId = item.application.internship_id;
    const existing = map[intId];
    // Prefer non-Withdrawn applications over Withdrawn ones, or newer over older
    if (!existing) {
      map[intId] = safeItem;
    } else if (
      existing.application.status === "Withdrawn" &&
      safeItem.application.status !== "Withdrawn"
    ) {
      map[intId] = safeItem;
    }
  }
  return map;
}

export function getEnrichedInternshipById(
  internshipId: string,
  onlyPublic = true
): EnrichedInternship | null {
  const all = getEnrichedInternships(onlyPublic);
  return all.find((item) => item.internship.id === internshipId) || null;
}

export function sanitizeProfile(profile: Profile): Omit<Profile, "password_hash"> {
  const { password_hash: _unused, ...safe } = profile;
  void _unused;
  return safe;
}

