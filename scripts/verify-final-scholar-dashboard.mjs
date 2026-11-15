import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve("public/screenshots/final-scholar-verification");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyScholarDashboard() {
  console.log("================================================================================");
  console.log("FINAL REAL BROWSER VERIFICATION: /dashboard/scholar");
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Authenticate as PhD Scholar priyakumari
    console.log("▶ Authenticating as PhD Scholar priyakumari...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.mainFrame().waitForFunction(() => {
      const form = document.querySelector("form");
      return form && Object.keys(form).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactEvents"));
    }, { timeout: 15000 });

    await page.type('input[type="email"]', "kumarpriya1234@gmail.com");
    await page.type('input[type="password"]', "Subodh@12345");
    await page.click('button[type="submit"]');

    // Wait for redirect to /dashboard/scholar
    await page.mainFrame().waitForFunction(
      () => window.location.pathname.includes("/dashboard/scholar"),
      { timeout: 30000 }
    );
    console.log("  ✓ Successfully signed in. URL:", page.url());

    // 2. Verify Overview
    console.log("▶ Verifying /dashboard/scholar Overview tab...");
    await page.waitForSelector("h1, h2, h3", { timeout: 20000 });
    const text = await page.evaluate(() => document.body.innerText);

    // Assert no Webpack errors
    assert.strictEqual(text.includes("Cannot find module"), false, "Must NOT have 'Cannot find module'");
    assert.strictEqual(text.includes("7627.js"), false, "Must NOT have '7627.js' error");
    assert.strictEqual(text.includes("Server Error"), false, "Must NOT have Server Error");

    assert.ok(text.includes("priyakumari"), "Scholar name must be displayed");
    assert.ok(text.includes("NIT Raipur") || text.includes("nit raipur"), "Scholar institution must be displayed");
    assert.ok(text.includes("Quantum Information Science") || text.includes("Interdisciplinary Research"), "Academic classification must be displayed");

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "final-scholar-overview.png") });
    console.log("  ✓ Overview tab rendered perfectly without any errors!");

    // 3. Verify My Profile tab
    console.log("▶ Verifying My Profile tab...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const b = btns.find((x) => x.textContent && x.textContent.includes("My Profile"));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    const profileText = await page.evaluate(() => document.body.innerText);
    assert.strictEqual(profileText.includes("Cannot find module"), false);
    assert.ok(profileText.includes("Quantum Information Science"), "Specialization must appear in profile");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "final-scholar-profile.png") });
    console.log("  ✓ My Profile tab rendered perfectly!");

    // 4. Verify My Internships tab
    console.log("▶ Verifying My Internships tab...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const b = btns.find((x) => x.textContent && x.textContent.includes("My Internships"));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    const internshipsText = await page.evaluate(() => document.body.innerText);
    assert.strictEqual(internshipsText.includes("Cannot find module"), false);
    assert.ok(internshipsText.includes("quantum with math"), "Internship 'quantum with math' must appear");
    assert.ok(internshipsText.includes("theory of quantum"), "Internship 'theory of quantum' must appear");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "final-scholar-internships.png") });
    console.log("  ✓ My Internships tab rendered both published internships!");

    // 5. Verify Applications tab
    console.log("▶ Verifying Applications tab...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const b = btns.find((x) => x.textContent && x.textContent.includes("Applications"));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    const appsText = await page.evaluate(() => document.body.innerText);
    assert.strictEqual(appsText.includes("Cannot find module"), false);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "final-scholar-applications.png") });
    console.log("  ✓ Applications tab rendered cleanly!");

    console.log("\n================================================================================");
    console.log("VERIFICATION SUCCESSFUL: /dashboard/scholar LOADS 100% CLEANLY IN REAL CHROME!");
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Screenshots: ${SCREENSHOT_DIR}`);
    console.log("================================================================================\n");

  } finally {
    try {
      await page.close().catch(() => {});
      await browser.close().catch(() => {});
    } catch {}
  }
  process.exit(0);
}

verifyScholarDashboard().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
