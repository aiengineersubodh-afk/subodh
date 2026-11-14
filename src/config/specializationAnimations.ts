/**
 * STARSKY Centralized Specialization Animation Registry
 *
 * Maps every academic specialization database ID and normalized slug
 * to its dedicated, self-contained HTML animation asset.
 * Includes graceful neutral fallback for any newly added future specializations.
 */

export interface SpecializationAnimationConfig {
  id: string;
  name: string;
  domainId: string;
  animationUrl: string;
}

export const FALLBACK_ANIMATION_URL = "/animations/specializations/fallback.html";

export const SPECIALIZATION_ANIMATIONS: Record<string, string> = {
  // Engineering (12)
  "spec-engineering-computer-science-engineering":
    "/animations/specializations/engineering/computer-science-engineering.html",
  "spec-engineering-artificial-intelligence-and-machine-learning":
    "/animations/specializations/engineering/artificial-intelligence-machine-learning.html",
  "spec-engineering-data-science":
    "/animations/specializations/engineering/data-science.html",
  "spec-engineering-cybersecurity":
    "/animations/specializations/engineering/cybersecurity.html",
  "spec-engineering-electronics-and-communication":
    "/animations/specializations/engineering/electronics-communication.html",
  "spec-engineering-electrical-engineering":
    "/animations/specializations/engineering/electrical-engineering.html",
  "spec-engineering-mechanical-engineering":
    "/animations/specializations/engineering/mechanical-engineering.html",
  "spec-engineering-civil-engineering":
    "/animations/specializations/engineering/civil-engineering.html",
  "spec-engineering-chemical-engineering":
    "/animations/specializations/engineering/chemical-engineering.html",
  "spec-engineering-biotechnology":
    "/animations/specializations/engineering/biotechnology.html",
  "spec-engineering-information-technology":
    "/animations/specializations/engineering/information-technology.html",
  "spec-engineering-robotics-and-automation":
    "/animations/specializations/engineering/robotics-automation.html",

  // Medical and Healthcare (9)
  "spec-medical-general-medicine":
    "/animations/specializations/medical/general-medicine.html",
  "spec-medical-surgery":
    "/animations/specializations/medical/surgery.html",
  "spec-medical-pharmacology":
    "/animations/specializations/medical/pharmacology.html",
  "spec-medical-microbiology":
    "/animations/specializations/medical/microbiology.html",
  "spec-medical-biotechnology":
    "/animations/specializations/medical/biotechnology.html",
  "spec-medical-neuroscience":
    "/animations/specializations/medical/neuroscience.html",
  "spec-medical-public-health":
    "/animations/specializations/medical/public-health.html",
  "spec-medical-medical-imaging":
    "/animations/specializations/medical/medical-imaging.html",
  "spec-medical-bioinformatics":
    "/animations/specializations/medical/bioinformatics.html",

  // Science (6)
  "spec-science-physics":
    "/animations/specializations/science/physics.html",
  "spec-science-chemistry":
    "/animations/specializations/science/chemistry.html",
  "spec-science-mathematics":
    "/animations/specializations/science/mathematics.html",
  "spec-science-biology":
    "/animations/specializations/science/biology.html",
  "spec-science-statistics":
    "/animations/specializations/science/statistics.html",
  "spec-science-environmental-science":
    "/animations/specializations/science/environmental-science.html",

  // Management (5)
  "spec-management-finance":
    "/animations/specializations/management/finance.html",
  "spec-management-marketing":
    "/animations/specializations/management/marketing.html",
  "spec-management-human-resource-management":
    "/animations/specializations/management/human-resource-management.html",
  "spec-management-operations":
    "/animations/specializations/management/operations.html",
  "spec-management-business-analytics":
    "/animations/specializations/management/business-analytics.html",

  // Commerce (5)
  "spec-commerce-accounting-and-auditing":
    "/animations/specializations/commerce/accounting-auditing.html",
  "spec-commerce-international-trade":
    "/animations/specializations/commerce/international-trade.html",
  "spec-commerce-econometrics":
    "/animations/specializations/commerce/econometrics.html",
  "spec-commerce-corporate-governance":
    "/animations/specializations/commerce/corporate-governance.html",
  "spec-commerce-banking-and-fintech":
    "/animations/specializations/commerce/banking-fintech.html",

  // Arts and Humanities (5)
  "spec-arts-cognitive-psychology":
    "/animations/specializations/arts/cognitive-psychology.html",
  "spec-arts-computational-linguistics":
    "/animations/specializations/arts/computational-linguistics.html",
  "spec-arts-sociology-and-development":
    "/animations/specializations/arts/sociology-development.html",
  "spec-arts-public-policy":
    "/animations/specializations/arts/public-policy.html",
  "spec-arts-modern-history-and-archives":
    "/animations/specializations/arts/modern-history-archives.html",

  // Law (5)
  "spec-law-intellectual-property-law":
    "/animations/specializations/law/intellectual-property-law.html",
  "spec-law-cyber-and-technology-law":
    "/animations/specializations/law/cyber-technology-law.html",
  "spec-law-constitutional-law":
    "/animations/specializations/law/constitutional-law.html",
  "spec-law-environmental-law":
    "/animations/specializations/law/environmental-law.html",
  "spec-law-international-arbitration":
    "/animations/specializations/law/international-arbitration.html",

  // Agriculture (5)
  "spec-agriculture-precision-agronomy":
    "/animations/specializations/agriculture/precision-agronomy.html",
  "spec-agriculture-plant-breeding-and-genetics":
    "/animations/specializations/agriculture/plant-breeding-genetics.html",
  "spec-agriculture-soil-and-water-engineering":
    "/animations/specializations/agriculture/soil-water-engineering.html",
  "spec-agriculture-horticulture-science":
    "/animations/specializations/agriculture/horticulture-science.html",
  "spec-agriculture-agricultural-economics":
    "/animations/specializations/agriculture/agricultural-economics.html",

  // Interdisciplinary Research (5)
  "spec-interdisciplinary-climate-systems-and-sustainability":
    "/animations/specializations/interdisciplinary/climate-systems-sustainability.html",
  "spec-interdisciplinary-quantum-information-science":
    "/animations/specializations/interdisciplinary/quantum-information-science.html",
  "spec-interdisciplinary-computational-social-science":
    "/animations/specializations/interdisciplinary/computational-social-science.html",
  "spec-interdisciplinary-biomedical-engineering-systems":
    "/animations/specializations/interdisciplinary/biomedical-engineering-systems.html",
  "spec-interdisciplinary-ai-ethics-and-governance":
    "/animations/specializations/interdisciplinary/ai-ethics-governance.html",
};

/**
 * Normalizes any specialization name or slug to aid in matching
 */
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns the animation URL for a given specialization ID or name.
 * If not found, gracefully returns the neutral professional fallback animation.
 */
export function getSpecializationAnimationUrl(
  specId?: string | null,
  specName?: string | null,
  domainId?: string | null
): string {
  if (specId && SPECIALIZATION_ANIMATIONS[specId]) {
    return SPECIALIZATION_ANIMATIONS[specId];
  }

  // Try matching by normalized name if ID didn't match directly
  if (specName) {
    const norm = normalizeKey(specName);
    for (const [key, url] of Object.entries(SPECIALIZATION_ANIMATIONS)) {
      if (key.includes(norm) || normalizeKey(url).includes(norm)) {
        return url;
      }
    }
  }

  // Graceful fallback animation
  return FALLBACK_ANIMATION_URL;
}

