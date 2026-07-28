import assert from 'assert';

const PORT = process.env.PORT || 8787;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  try {
    const urlsToTest = [
      `${BASE_URL}/auth/confirm`,
      `${BASE_URL}/auth/confirm#access_token=test`
    ];

    for (const url of urlsToTest) {
      console.log(`Testing URL: ${url}`);
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}. Status: ${res.status}`);
      }

      const html = await res.text();

      assert(html.includes("Open in Kynisto App"), `HTML output for ${url} did not contain "Open in Kynisto App".`);
      assert(html.includes("intent://auth/confirm"), `HTML output for ${url} did not contain "intent://auth/confirm".`);
      
      console.log(`✅ Success for ${url}`);
    }

    console.log("All tests passed!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exitCode = 1;
  }
}

runTests();
