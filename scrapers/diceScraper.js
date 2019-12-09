const cheerio = require("cheerio");
const jobBoard = require("../utility/jobBoard");
const downloadTestHtmlFile = false;

async function createDiceJobObjects(jobPage, browser) {
  const page = await browser.newPage();
  await page.goto(jobPage, { waitUntil: "networkidle2", timeout: 0 });
  const html = await page.evaluate(() => document.body.innerHTML);
  const $ = cheerio.load(html);
  const title = $("#header-wrap > div.container > div .jobTitle").text();
  const description = $("#jobdescSec")
    .text()
    .trim();
  const postedBy = $("#hiringOrganizationName").text();
  const applyUrl = $("#applybtn").attr("onclick");
  await jobBoard.save(title, description, postedBy, applyUrl, "Dice");
}

async function scrapeJobLinks(html) {
  const $ = await cheerio.load(html);
  const results = $("a.card-title-link").map((i, el) => {
    return $(el).attr("href");
  }).get();
  return results
}

async function diceScrape(browser, queries) {
  queries.map(async el => {
    let search = el.query.replace(" ", "%20");
    let url = `https://www.dice.com/jobs?q=${search}&location=Portland,%20OR,%20USA&latitude=45.5051064&longitude=-122.67502609999997&countryCode=US&locationPrecision=City&radius=30&radiusUnit=mi&page=1&pageSize=20&facets=employmentType%7CpostedDate%7CworkFromHomeAvailability%7CemployerType%7CeasyApply&filters.postedDate=ONE&language=en`;
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
      const html = await page.evaluate(() => document.body.innerHTML);
      // global switch variable
      if (downloadTestHtmlFile) {
        fs.writeFileSync("./test-html/diceJobBoard.html", html);
      }
      const jobLinks = await scrapeJobLinks(html)
      jobLinks.map(async jobPage => {
        await createDiceJobObjects(jobPage, browser);
      })
    } catch (err) {
      console.error(err);
    }
  });
}

async function sleep(mseconds) {
  return new Promise(resolve => setTimeout(resolve, mseconds));
}

module.exports = {
  diceScrape
};