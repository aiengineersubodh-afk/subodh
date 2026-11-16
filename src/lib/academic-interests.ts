/**
 * Centralized Academic and Research Interests Taxonomy Mapping for STARSKY.
 * Covers all 9 Academic Domains and all 57 Specializations.
 * Used dynamically across Student and PhD Scholar onboarding and profile workflows.
 */

export interface SpecializationInterestGroup {
  specializationId: string;
  specializationName: string;
  domainId: string;
  domainName: string;
  suggestions: string[];
}

export const ACADEMIC_INTERESTS_BY_SPECIALIZATION: Record<string, string[]> = {
  // ===========================================================================
  // 1. DOMAIN: Engineering (dom-engineering) — 12 Specializations
  // ===========================================================================
  "spec-engineering-computer-science-engineering": [
    "Distributed Systems",
    "Algorithms & Complexity",
    "Computer Architecture",
    "Operating Systems",
    "Software Engineering",
    "Cloud Computing",
    "Parallel Computing",
  ],
  "spec-engineering-artificial-intelligence-and-machine-learning": [
    "Machine Learning",
    "Deep Learning",
    "Neural Networks",
    "Natural Language Processing",
    "Computer Vision",
    "Reinforcement Learning",
    "Generative AI",
  ],
  "spec-engineering-data-science": [
    "Predictive Modeling",
    "Big Data Analytics",
    "Statistical Learning",
    "Data Mining",
    "Time Series Analysis",
    "Graph Analytics",
    "Feature Engineering",
  ],
  "spec-engineering-cybersecurity": [
    "Network Security",
    "Cryptography",
    "Penetration Testing",
    "Malware Analysis",
    "Cloud Security",
    "Zero Trust Architecture",
    "Threat Intelligence",
  ],
  "spec-engineering-electronics-and-communication": [
    "Wireless Communications",
    "VLSI Design",
    "Signal Processing",
    "Embedded Systems",
    "Optical Communications",
    "RF & Microwave Systems",
    "IoT Architectures",
  ],
  "spec-engineering-electrical-engineering": [
    "Power Systems",
    "Smart Grids",
    "Renewable Energy Systems",
    "Control Systems",
    "Power Electronics",
    "Electric Vehicles",
    "High Voltage Engineering",
  ],
  "spec-engineering-mechanical-engineering": [
    "Thermal & Fluid Sciences",
    "Solid Mechanics",
    "Computational Fluid Dynamics",
    "Finite Element Analysis",
    "Additive Manufacturing",
    "Robotic Kinematics",
    "Materials Tribology",
  ],
  "spec-engineering-civil-engineering": [
    "Structural Engineering",
    "Geotechnical Engineering",
    "Transportation Systems",
    "Water Resources",
    "Earthquake Engineering",
    "Sustainable Infrastructure",
    "Concrete Technology",
  ],
  "spec-engineering-chemical-engineering": [
    "Catalysis & Reaction Engineering",
    "Transport Phenomena",
    "Polymer Science",
    "Process Simulation",
    "Biochemical Engineering",
    "Membrane Separations",
    "Green Chemical Processes",
  ],
  "spec-engineering-biotechnology": [
    "Genetic Engineering",
    "Bioprocess Technology",
    "Molecular Diagnostics",
    "CRISPR & Gene Editing",
    "Metabolic Engineering",
    "Bio-nanotechnology",
    "Immunotechnology",
  ],
  "spec-engineering-information-technology": [
    "Enterprise Software Architecture",
    "Database Systems",
    "DevOps & CI/CD",
    "Web Technologies",
    "Information Security",
    "API Engineering",
    "System Integration",
  ],
  "spec-engineering-robotics-and-automation": [
    "Autonomous Mobile Robots",
    "Visual SLAM",
    "Motion Planning",
    "Industrial Automation",
    "Human-Robot Interaction",
    "Sensor Fusion",
    "Soft Robotics",
  ],

  // ===========================================================================
  // 2. DOMAIN: Medical and Healthcare (dom-medical) — 9 Specializations
  // ===========================================================================
  "spec-medical-general-medicine": [
    "Internal Medicine",
    "Clinical Diagnostics",
    "Preventive Healthcare",
    "Chronic Disease Management",
    "Evidence-Based Medicine",
    "Patient Cohort Analysis",
    "Pathophysiology",
  ],
  "spec-medical-surgery": [
    "Minimally Invasive Surgery",
    "Surgical Robotics",
    "Preoperative Optimization",
    "Trauma Surgery",
    "Oncological Resection",
    "Tissue Regeneration",
    "Surgical Outcomes Research",
  ],
  "spec-medical-pharmacology": [
    "Pharmacokinetics",
    "Drug Discovery & Delivery",
    "Toxicology",
    "Pharmacogenomics",
    "Neuropharmacology",
    "Clinical Trials",
    "Therapeutic Drug Monitoring",
  ],
  "spec-medical-microbiology": [
    "Antimicrobial Resistance",
    "Virology & Vaccine Design",
    "Bacterial Pathogenesis",
    "Host-Pathogen Interactions",
    "Microbiome Analysis",
    "Clinical Mycology",
    "Diagnostic Bacteriology",
  ],
  "spec-medical-biotechnology": [
    "Stem Cell Therapeutics",
    "Monoclonal Antibodies",
    "Recombinant Therapeutics",
    "Targeted Gene Delivery",
    "Biosensors",
    "Tissue Engineering",
    "Immunotherapy",
  ],
  "spec-medical-neuroscience": [
    "Cognitive Neuroimaging",
    "Neurodegenerative Diseases",
    "Synaptic Plasticity",
    "Electrophysiology",
    "Computational Neuroscience",
    "Neuroregeneration",
    "Brain-Computer Interfaces",
  ],
  "spec-medical-public-health": [
    "Epidemiology",
    "Biostatistics",
    "Global Health Equity",
    "Maternal & Child Health",
    "Health Economics",
    "Environmental Epidemiology",
    "Infectious Disease Surveillance",
  ],
  "spec-medical-medical-imaging": [
    "Medical Image Processing",
    "Radiology",
    "Image Segmentation",
    "Diagnostic Imaging",
    "Computer-Aided Diagnosis",
    "Biomedical Image Analysis",
    "MRI Sequence Optimization",
  ],
  "spec-medical-bioinformatics": [
    "Genomic Sequence Alignment",
    "Structural Proteomics",
    "Transcriptomics Analysis",
    "Phylogenetic Trees",
    "Biological Network Modeling",
    "Metabolomics",
    "Multi-Omics Integration",
  ],

  // ===========================================================================
  // 3. DOMAIN: Science (dom-science) — 6 Specializations
  // ===========================================================================
  "spec-science-physics": [
    "Condensed Matter Physics",
    "Quantum Mechanics",
    "Astrophysics & Cosmology",
    "Optics & Photonics",
    "High Energy Particle Physics",
    "Superconductivity",
    "Statistical Mechanics",
  ],
  "spec-science-chemistry": [
    "Organic Synthesis",
    "Computational Chemistry",
    "Inorganic Coordination",
    "Physical Chemistry",
    "Spectroscopy & Crystallography",
    "Nanochemistry",
    "Materials Chemistry",
  ],
  "spec-science-mathematics": [
    "Pure Mathematics",
    "Differential Equations",
    "Algebraic Topology",
    "Number Theory",
    "Functional Analysis",
    "Dynamical Systems",
    "Numerical Analysis",
  ],
  "spec-science-biology": [
    "Cellular & Molecular Biology",
    "Evolutionary Biology",
    "Ecology & Ecosystem Dynamics",
    "Developmental Biology",
    "Plant Physiology",
    "Animal Behavior",
    "Population Genetics",
  ],
  "spec-science-statistics": [
    "Bayesian Inference",
    "Mathematical Statistics",
    "Survival Analysis",
    "Experimental Design",
    "Non-parametric Modeling",
    "Stochastic Processes",
    "High-Dimensional Inference",
  ],
  "spec-science-environmental-science": [
    "Climate Change Modeling",
    "Ecosystem Conservation",
    "Water Quality Assessment",
    "Air Pollution Dynamics",
    "Biogeochemical Cycles",
    "Remote Sensing for Ecology",
    "Environmental Impact Analysis",
  ],

  // ===========================================================================
  // 4. DOMAIN: Management (dom-management) — 5 Specializations
  // ===========================================================================
  "spec-management-finance": [
    "Corporate Finance",
    "Asset Pricing",
    "Portfolio Management",
    "Derivatives & Risk Hedging",
    "Behavioral Finance",
    "Financial Econometrics",
    "Mergers & Acquisitions",
  ],
  "spec-management-marketing": [
    "Consumer Behavior",
    "Digital Marketing Strategy",
    "Brand Equity Analysis",
    "Market Research Methodologies",
    "Neuromarketing",
    "Omnichannel Retailing",
    "Customer Lifetime Value",
  ],
  "spec-management-human-resource-management": [
    "Strategic Talent Acquisition",
    "Organizational Behavior",
    "Employee Engagement & Retention",
    "Performance Management Systems",
    "Diversity, Equity & Inclusion",
    "HR Analytics",
    "Leadership Development",
  ],
  "spec-management-operations": [
    "Supply Chain Optimization",
    "Inventory Theory",
    "Lean Six Sigma",
    "Logistics & Distribution",
    "Queueing Theory",
    "Operations Strategy",
    "Procurement Management",
  ],
  "spec-management-business-analytics": [
    "Predictive Business Modeling",
    "Decision Support Systems",
    "Customer Analytics",
    "Prescriptive Analytics",
    "Dashboard Design & BI",
    "Revenue Optimization",
    "Supply Chain Analytics",
  ],

  // ===========================================================================
  // 5. DOMAIN: Commerce (dom-commerce) — 5 Specializations
  // ===========================================================================
  "spec-commerce-accounting-and-auditing": [
    "Forensic Accounting",
    "IFRS & GAAP Compliance",
    "Auditing Standards",
    "Managerial Accounting",
    "Taxation & Policy",
    "Internal Controls Assessment",
    "Financial Reporting Analytics",
  ],
  "spec-commerce-international-trade": [
    "Trade Policy Analysis",
    "Customs & Tariff Regulation",
    "Global Value Chains",
    "Export-Import Management",
    "Trade Finance",
    "FDI & Capital Flows",
    "WTO & Multilateral Treaties",
  ],
  "spec-commerce-econometrics": [
    "Panel Data Econometrics",
    "Causal Identification",
    "Microeconometric Modeling",
    "Macroeconomic Forecasting",
    "Instrumental Variables",
    "Time Series Cointegration",
    "Structural Equation Modeling",
  ],
  "spec-commerce-corporate-governance": [
    "Boardroom Dynamics & Ethics",
    "Shareholder Rights & Activism",
    "ESG Reporting & Standards",
    "Executive Compensation Analysis",
    "Regulatory Compliance",
    "Risk Governance",
    "Corporate Social Responsibility",
  ],
  "spec-commerce-banking-and-fintech": [
    "Digital Banking Architecture",
    "Decentralized Finance (DeFi)",
    "Payment Gateway Technologies",
    "Credit Scoring Algorithms",
    "Regulatory Sandboxes & RegTech",
    "Microfinance Models",
    "Algorithmic Trading Systems",
  ],

  // ===========================================================================
  // 6. DOMAIN: Arts and Humanities (dom-arts) — 5 Specializations
  // ===========================================================================
  "spec-arts-cognitive-psychology": [
    "Working Memory & Attention",
    "Perception & Psychophysics",
    "Decision Making & Heuristics",
    "Neurocognitive Aging",
    "Language Acquisition",
    "Experimental Cognitive Design",
    "Cognitive Rehabilitation",
  ],
  "spec-arts-computational-linguistics": [
    "Morphological Parsing",
    "Syntactic Treebanks",
    "Corpus Linguistics",
    "Semantics & Pragmatics",
    "Speech Recognition & Phonetics",
    "Discourse Analysis",
    "Cross-lingual Transfer",
  ],
  "spec-arts-sociology-and-development": [
    "Rural & Urban Sociology",
    "Social Stratification & Caste",
    "Migration & Diaspora Studies",
    "Gender & Social Justice",
    "Community Development",
    "Qualitative Ethnography",
    "Agrarian Transformation",
  ],
  "spec-arts-public-policy": [
    "Policy Formulation & Evaluation",
    "Governance & Bureaucracy",
    "Social Welfare Programs",
    "Urban Governance & Planning",
    "Healthcare Policy Analysis",
    "Education Policy Reform",
    "Regulatory Economics",
  ],
  "spec-arts-modern-history-and-archives": [
    "Modern History",
    "Historical Research",
    "Archival Studies",
    "Cultural Heritage",
    "Historical Documentation",
    "Social History",
    "Primary Source Analysis",
  ],

  // ===========================================================================
  // 7. DOMAIN: Law (dom-law) — 5 Specializations
  // ===========================================================================
  "spec-law-intellectual-property-law": [
    "Patent Law & Litigation",
    "Copyright & Digital Rights",
    "Trademark Jurisprudence",
    "Trade Secrets Protection",
    "IP Licensing & Tech Transfer",
    "Biotechnology Patenting",
    "Open Source Licensing",
  ],
  "spec-law-cyber-and-technology-law": [
    "Data Protection & GDPR",
    "Cybercrime Jurisprudence",
    "AI Regulation & Liability",
    "Digital Evidence & Forensics",
    "Platform Intermediary Liability",
    "Cloud Computing Law",
    "Surveillance & Privacy Rights",
  ],
  "spec-law-constitutional-law": [
    "Judicial Review & Federalism",
    "Fundamental Rights Litigation",
    "Constitutional Interpretation",
    "Comparative Constitutionalism",
    "Separation of Powers",
    "Due Process & Natural Justice",
    "Human Rights Jurisprudence",
  ],
  "spec-law-environmental-law": [
    "Climate Change Litigation",
    "Environmental Impact Assessment Law",
    "Wildlife & Forest Protection",
    "Polluter Pays Jurisprudence",
    "Renewable Energy Regulation",
    "International Environmental Treaties",
    "Water Law & Riparian Rights",
  ],
  "spec-law-international-arbitration": [
    "Commercial Arbitration Rules",
    "Investment Treaty Arbitration",
    "Bilateral Investment Treaties (BITs)",
    "Enforcement of Foreign Awards",
    "Alternative Dispute Resolution",
    "Cross-Border Mediation",
    "Maritime & Sovereign Disputes",
  ],

  // ===========================================================================
  // 8. DOMAIN: Agriculture (dom-agriculture) — 5 Specializations
  // ===========================================================================
  "spec-agriculture-precision-agronomy": [
    "Variable Rate Technology",
    "Satellite Remote Sensing for Crops",
    "Drone-Based Crop Scouting",
    "Yield Mapping & Soil Sensors",
    "Smart Irrigation Automation",
    "Nutrient Management Systems",
    "Digital Farming Platforms",
  ],
  "spec-agriculture-plant-breeding-and-genetics": [
    "Marker-Assisted Selection",
    "Hybrid Seed Production",
    "Crop Abiotic Stress Resistance",
    "Quantitative Trait Loci (QTL)",
    "Plant Tissue Culture",
    "Genomic Selection in Crops",
    "Germplasm Conservation",
  ],
  "spec-agriculture-soil-and-water-engineering": [
    "Micro-Irrigation Systems",
    "Watershed Hydrology",
    "Soil Erosion Control",
    "Groundwater Recharging",
    "Drainage Engineering",
    "Salinity Management",
    "Hydroponics & Aquaponics",
  ],
  "spec-agriculture-horticulture-science": [
    "Post-Harvest Physiology",
    "Protected Cultivation & Greenhouses",
    "Fruit Crop Biotechnology",
    "Floriculture & Landscaping",
    "Organic Vegetable Production",
    "Medicinal Plant Farming",
    "Plant Growth Regulators",
  ],
  "spec-agriculture-agricultural-economics": [
    "Farm Management & Production",
    "Commodity Price Volatility",
    "Agricultural Supply Chains",
    "Crop Insurance & Risk",
    "Food Security Policy",
    "Rural Credit & Microfinance",
    "Agri-Business Market Analysis",
  ],

  // ===========================================================================
  // 9. DOMAIN: Interdisciplinary Research (dom-interdisciplinary) — 5 Specializations
  // ===========================================================================
  "spec-interdisciplinary-climate-systems-and-sustainability": [
    "Earth System Modeling",
    "Renewable Energy Transition",
    "Carbon Capture & Sequestration",
    "Circular Economy Strategies",
    "Urban Climate Resilience",
    "Socio-Ecological Systems",
    "Climate Risk Metrics",
  ],
  "spec-interdisciplinary-quantum-information-science": [
    "Quantum Computing Algorithms",
    "Quantum Cryptography & QKD",
    "Quantum Error Correction",
    "Superconducting Qubits",
    "Quantum Machine Learning",
    "Quantum Sensing & Metrology",
    "Topological Quantum Matter",
  ],
  "spec-interdisciplinary-computational-social-science": [
    "Social Network Analysis",
    "Agent-Based Social Simulation",
    "Digital Footprint Analytics",
    "Opinion Dynamics Modeling",
    "Online Disinformation Tracking",
    "Cultural Analytics",
    "Computational Political Science",
  ],
  "spec-interdisciplinary-biomedical-engineering-systems": [
    "Biocompatible Implants",
    "Bio-MEMS & Lab-on-a-Chip",
    "Prosthetics & Biomechanics",
    "Physiological Signal Processing",
    "Cardiovascular Hemodynamics",
    "Targeted Nano-Theranostics",
    "Medical Device Instrumentation",
  ],
  "spec-interdisciplinary-ai-ethics-and-governance": [
    "Algorithmic Bias & Fairness",
    "Explainable AI (XAI)",
    "AI Safety & Alignment",
    "Automated Decision Transparency",
    "Data Sovereignty & Ethics",
    "Regulatory Frameworks for AI",
    "Societal Impact of Frontier AI",
  ],
};

/**
 * Domain-level fallback suggestions when a domain is selected but specialization is not yet chosen.
 */
export const DOMAIN_LEVEL_INTERESTS: Record<string, string[]> = {
  "dom-engineering": [
    "Advanced Computing",
    "System Optimization",
    "Applied Mathematics",
    "Modeling & Simulation",
    "Prototyping & Design",
    "Signal Processing",
  ],
  "dom-medical": [
    "Clinical Research",
    "Translational Medicine",
    "Patient Cohort Analysis",
    "Public Health & Prevention",
    "Therapeutic Innovation",
    "Biomedical Diagnostics",
  ],
  "dom-science": [
    "Theoretical Modeling",
    "Experimental Design",
    "Data Analysis & Inference",
    "Laboratory Methodology",
    "Physical & Chemical Analysis",
    "Fundamental Research",
  ],
  "dom-management": [
    "Strategic Analysis",
    "Organizational Theory",
    "Quantitative Business Methods",
    "Operational Efficiency",
    "Market Dynamics",
    "Leadership & Governance",
  ],
  "dom-commerce": [
    "Financial Systems",
    "Economic Analysis",
    "Trade & Market Dynamics",
    "Quantitative Accounting",
    "Corporate Regulation",
    "Policy & Governance",
  ],
  "dom-arts": [
    "Qualitative Methodology",
    "Cultural & Historical Analysis",
    "Social Theory",
    "Discourse Analysis",
    "Archival Documentation",
    "Critical Synthesis",
  ],
  "dom-law": [
    "Jurisprudential Analysis",
    "Statutory Interpretation",
    "Comparative Legal Systems",
    "Litigation & Dispute Resolution",
    "Regulatory Compliance",
    "Legal Drafting",
  ],
  "dom-agriculture": [
    "Sustainable Agrisystems",
    "Crop Physiology",
    "Soil & Water Management",
    "Applied Agrotechnology",
    "Food Systems & Security",
    "Agricultural Economics",
  ],
  "dom-interdisciplinary": [
    "Cross-Disciplinary Modeling",
    "Complex Systems",
    "Ethical Governance",
    "Emerging Technologies",
    "Sociotechnical Analysis",
    "Data-Driven Discovery",
  ],
};

/**
 * Retrieve curated dynamic academic interest suggestions based on the user's selected specialization or domain.
 *
 * @param domainId Primary domain identifier (e.g., "dom-arts", "dom-engineering")
 * @param specializationId Primary specialization identifier (e.g., "spec-arts-modern-history-and-archives")
 * @returns Array of 6-7 relevant suggestion strings
 */
export function getAcademicInterestSuggestions(
  domainId?: string,
  specializationId?: string
): string[] {
  if (specializationId && ACADEMIC_INTERESTS_BY_SPECIALIZATION[specializationId]) {
    return ACADEMIC_INTERESTS_BY_SPECIALIZATION[specializationId];
  }

  if (domainId && DOMAIN_LEVEL_INTERESTS[domainId]) {
    return DOMAIN_LEVEL_INTERESTS[domainId];
  }

  // Sensible default fallback when neither is selected yet
  return [
    "Research Methodology",
    "Literature Review",
    "Empirical Analysis",
    "Academic Writing",
    "Data Visualization",
    "Interdisciplinary Studies",
  ];
}
