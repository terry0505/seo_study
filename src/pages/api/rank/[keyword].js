import puppeteer from "puppeteer";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET 요청만 허용됩니다." });
  }

  const { keyword, site } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: "키워드를 입력해주세요." });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    );

    let currentPage = 1;
    const targetDomain =
      site === "gong" ? "gong.conects.com" : "megagong.net";
    let searchResults = [];
    let foundRank = null;
    let foundUrl = null;
    let top10Count = 0;

    while (currentPage <= 5) {
      const searchURL = `https://www.google.com/search?q=${encodeURIComponent(
        keyword
      )}&start=${(currentPage - 1) * 10}`;

      await page.goto(searchURL, { waitUntil: "domcontentloaded" });

      await page.evaluate(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
      });

      const pageResults = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".MjjYud"))
          .map((el) => ({
            title: el.querySelector("h3")?.innerText || "제목 없음",
            url: el.querySelector("a")?.href || ""
          }))
          .filter(
            (result) => result.title !== "제목 없음" || result.url !== ""
          );
      });

      pageResults.forEach((result, index) => {
        result.rank = searchResults.length + 1 + index;
      });

      searchResults = searchResults.concat(pageResults);

      const domainResult = searchResults.find((result) =>
        result.url.includes(targetDomain)
      );
      top10Count = searchResults.filter(
        (r) => r.url.includes(targetDomain) && r.rank <= 10
      ).length;

      if (domainResult) {
        foundRank = domainResult.rank;
        foundUrl = domainResult.url;
        break;
      }

      currentPage++;
    }

    await browser.close();
    res.status(200).json({
      keyword,
      activeRank: foundRank ? foundRank : "N/A",
      sourceUrl: foundUrl,
      top10Count,
      results: searchResults
    });
  } catch (error) {
    res.status(500).json({
      error: "검색 순위를 가져오는 중 오류 발생",
      details: error.message
    });
  }
}
