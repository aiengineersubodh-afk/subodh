import puppeteer from "puppeteer-core";

const BASE_URL = "http://localhost:3000";

async function testOtherPages() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  // Get student token
  const stuRes = await fetch(BASE_URL + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "aarav.sharma@nitk.edu.in", password: "Student@2026" }),
  });
  const stuCookie = stuRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const stuToken = stuCookie.match(/starsky_session_token=([^;]+)/)[1];

  // Get scholar token
  const schRes = await fetch(BASE_URL + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "ananya.raghavan@iisc.ac.in", password: "Scholar@2026" }),
  });
  const schCookie = schRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const schToken = schCookie.match(/starsky_session_token=([^;]+)/)[1];

  const pagesToTest = [
    { name: "Home Page", path: "/", token: stuToken, expectedText: "STARSKY" },
    { name: "Student Dashboard", path: "/dashboard/student", token: stuToken, expectedText: "Dashboard" },
    { name: "Scholar Dashboard", path: "/dashboard/scholar", token: schToken, expectedText: "My Internships" },
    { name: "Admin Portal Login", path: "/admin/login", token: null, expectedText: "Admin" },
    { name: "Scholar Profile", path: "/scholars/sch-f8e3c7fb", token: stuToken, expectedText: "Verified PhD Scholar" },
    { name: "Internship Details", path: "/internships/int-332e4b09", token: stuToken, expectedText: "priya sultan" },
  ];

  const page = await browser.newPage();
  const errors = [];

  page.on("pageerror", (err) => errors.push({ type: "pageerror", text: err.toString() }));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore normal expected 401 responses on unauthenticated login check
      if (!text.includes("401") && !text.includes("403")) {
        errors.push({ type: "console.error", text });
      }
    }
  });

  console.log("============================================================");
  console.log("VERIFYING OTHER STARSKY PAGES:");
  console.log("============================================================\n");

  for (const item of pagesToTest) {
    errors.length = 0;
    if (item.token) {
      await page.setCookie({
        name: "starsky_session_token",
        value: item.token,
        domain: "localhost",
        path: "/",
      });
    } else {
      await page.deleteCookie({ name: "starsky_session_token", domain: "localhost", path: "/" });
    }

    const res = await page.goto(BASE_URL + item.path, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1200));
    const status = res.status();
    const finalUrl = page.url();

    const result = await page.evaluate((exp) => {
      const text = document.body.innerText;
      const isBlank = text.trim().length === 0;
      const hasExp = text.toLowerCase().includes(exp.toLowerCase());
      const heading = document.querySelector("h1, h2, h3")?.innerText || "No Heading";
      return { isBlank, hasExp, heading, textLen: text.trim().length };
    }, item.expectedText);

    console.log(`Page: ${item.name} (${item.path})`);
    console.log(`  HTTP: ${status} | Final URL: ${finalUrl}`);
    console.log(`  Heading: "${result.heading.replace(/\n/g, ' ')}" | Text Length: ${result.textLen} | Expected Text Found: ${result.hasExp}`);
    console.log(`  Blank: ${result.isBlank} | Errors: ${errors.length}`);
    if (result.isBlank || !result.hasExp || errors.length > 0) {
      console.log("  -> FAILED!", errors);
      process.exit(1);
    } else {
      console.log("  -> PASS\n");
    }
  }

  await browser.close();
  console.log("All other pages verified successfully with 0 errors!");
}

testOtherPages().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
