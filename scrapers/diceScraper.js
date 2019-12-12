const cheerio = require("cheerio");
const jobBoard = require("../utility/jobBoard");
const request = require("request-promise");
const sleep = require("../utility/sleep");

async function createDiceJobObjects(jobPage, search) {
  try {
    const html = await request.get(jobPage);
    const $ = cheerio.load(html);
    const title = $("#header-wrap > div.container > div .jobTitle").text();
    if (title === "") {
      return;
    } else {
      const description = $("#jobdescSec")
        .text()
        .trim();
      const postedBy = $("#hiringOrganizationName").text();
      const applyUrl = $('#appUrl').attr('value');
      const jobBoardSite = "Dice";
      const searchQuery = search;
      const timeStamp = new Date();
      const job = {
        title,
        description,
        postedBy,
        applyUrl,
        jobBoardSite,
        searchQuery,
        timeStamp
      }
      await jobBoard.save(job);
      sleep.sleep(2000)
      return job
    }
  } catch (err) {
    console.error(err)
  }
}

async function scrapeJobLinks(html) {
  const $ = await cheerio.load(html);
  const results = $("a.card-title-link").map((i, el) => {
    return $(el).attr("href");
  }).get();
  return results
}

async function diceScrape(browser, queries) {
 const resultsArray = queries.map(async el => {
    const search = el.query.replace(" ", "%20");
    const url = `https://www.dice.com/jobs?q=${search}&location=Portland,%20OR,%20USA&latitude=45.5051064&longitude=-122.67502609999997&countryCode=US&locationPrecision=City&radius=30&radiusUnit=mi&page=1&pageSize=20&facets=employmentType%7CpostedDate%7CworkFromHomeAvailability%7CemployerType%7CeasyApply&filters.postedDate=ONE&language=en`;
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
      const html = await page.evaluate(() => document.body.innerHTML);
      const jobLinks = await scrapeJobLinks(html)
      const jobsArray = jobLinks.map(jobPage => {
        sleep.sleep(1000);
        return new Promise(async(resolve, reject) =>{
          const job = await createDiceJobObjects(jobPage, el.query)
          resolve(job);
        });
       })
      const jobs = await Promise.all(jobsArray)
      return jobs
    } catch (err) {
      console.error(err);
    }
  });
  let results = await Promise.all(resultsArray)
  results = [].concat.apply([], results);
  return results
}

module.exports = {
  diceScrape
};