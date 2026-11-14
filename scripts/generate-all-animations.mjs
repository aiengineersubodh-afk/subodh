import fs from "fs";
import path from "path";
import { engineeringAnimations } from "./animations/engineering.mjs";
import { medicalAnimations } from "./animations/medical.mjs";
import { scienceAnimations } from "./animations/science.mjs";
import { managementCommerceAnimations } from "./animations/management-commerce.mjs";
import { artsLawAnimations } from "./animations/arts-law.mjs";
import { agricultureInterdisciplinaryAnimations } from "./animations/agriculture-interdisciplinary.mjs";

const ROOT = process.cwd();
const BASE_OUT = path.join(ROOT, "public", "animations", "specializations");

const collections = [
  { dir: "engineering", items: engineeringAnimations },
  { dir: "medical", items: medicalAnimations },
  { dir: "science", items: scienceAnimations },
  {
    dir: "management",
    items: {
      "finance.html": managementCommerceAnimations["finance.html"],
      "marketing.html": managementCommerceAnimations["marketing.html"],
      "human-resource-management.html": managementCommerceAnimations["human-resource-management.html"],
      "operations.html": managementCommerceAnimations["operations.html"],
      "business-analytics.html": managementCommerceAnimations["business-analytics.html"]
    }
  },
  {
    dir: "commerce",
    items: {
      "accounting-auditing.html": managementCommerceAnimations["accounting-auditing.html"],
      "international-trade.html": managementCommerceAnimations["international-trade.html"],
      "econometrics.html": managementCommerceAnimations["econometrics.html"],
      "corporate-governance.html": managementCommerceAnimations["corporate-governance.html"],
      "banking-fintech.html": managementCommerceAnimations["banking-fintech.html"]
    }
  },
  {
    dir: "arts",
    items: {
      "cognitive-psychology.html": artsLawAnimations["cognitive-psychology.html"],
      "computational-linguistics.html": artsLawAnimations["computational-linguistics.html"],
      "sociology-development.html": artsLawAnimations["sociology-development.html"],
      "public-policy.html": artsLawAnimations["public-policy.html"],
      "modern-history-archives.html": artsLawAnimations["modern-history-archives.html"]
    }
  },
  {
    dir: "law",
    items: {
      "intellectual-property-law.html": artsLawAnimations["intellectual-property-law.html"],
      "cyber-technology-law.html": artsLawAnimations["cyber-technology-law.html"],
      "constitutional-law.html": artsLawAnimations["constitutional-law.html"],
      "environmental-law.html": artsLawAnimations["environmental-law.html"],
      "international-arbitration.html": artsLawAnimations["international-arbitration.html"]
    }
  },
  {
    dir: "agriculture",
    items: {
      "precision-agronomy.html": agricultureInterdisciplinaryAnimations["precision-agronomy.html"],
      "plant-breeding-genetics.html": agricultureInterdisciplinaryAnimations["plant-breeding-genetics.html"],
      "soil-water-engineering.html": agricultureInterdisciplinaryAnimations["soil-water-engineering.html"],
      "horticulture-science.html": agricultureInterdisciplinaryAnimations["horticulture-science.html"],
      "agricultural-economics.html": agricultureInterdisciplinaryAnimations["agricultural-economics.html"]
    }
  },
  {
    dir: "interdisciplinary",
    items: {
      "climate-systems-sustainability.html": agricultureInterdisciplinaryAnimations["climate-systems-sustainability.html"],
      "quantum-information-science.html": agricultureInterdisciplinaryAnimations["quantum-information-science.html"],
      "computational-social-science.html": agricultureInterdisciplinaryAnimations["computational-social-science.html"],
      "biomedical-engineering-systems.html": agricultureInterdisciplinaryAnimations["biomedical-engineering-systems.html"],
      "ai-ethics-governance.html": agricultureInterdisciplinaryAnimations["ai-ethics-governance.html"]
    }
  }
];

let fileCount = 0;

for (const col of collections) {
  const targetDir = path.join(BASE_OUT, col.dir);
  fs.mkdirSync(targetDir, { recursive: true });

  for (const [filename, htmlContent] of Object.entries(col.items)) {
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, htmlContent, "utf8");
    fileCount++;
    console.log(`Generated: ${path.relative(ROOT, filePath)}`);
  }
}

// Fallback animation
const fallbackPath = path.join(BASE_OUT, "fallback.html");
fs.writeFileSync(fallbackPath, agricultureInterdisciplinaryAnimations["fallback.html"], "utf8");
fileCount++;
console.log(`Generated: ${path.relative(ROOT, fallbackPath)}`);

console.log(`\nSuccessfully generated ${fileCount} animation files!`);

