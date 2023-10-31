const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const newsLimit = 5;

const getNews = async () => {
  // Start a Puppeteer session with:
  // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
  // - no default viewport (`defaultViewport: null` - website page will in full width and height)
  console.log("Browser initialization...");
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // Open a new page
  const page = await browser.newPage();

  console.log("Loading page...");
  await page.goto("https://russianemirates.com/news/uae-news/", {
    waitUntil: "domcontentloaded",
  });
  const expression = "//div[@class='info_block wow fadeInUp flex_item']";
  const baseURL = "https://russianemirates.com";

  const elements = await page.$x(expression);
  await page.waitForXPath(expression, { timeout: 3000 });
  const latestFiveNews = [];
  console.log("Parsing in progress...");
  for (let i = 0; i < elements.length && i < newsLimit; i++) {
    let news = await page.evaluate((el) => el.innerHTML, elements[i]);
    let $ = cheerio.load(news);
    const title = $("div.ib_head").text().trim();
    const description = $("div.ib_text p").text().trim();
    const unformattedDate = $("span.die-miniatqr-bottom-time-views")
      .text()
      .trim()
      .split(".");
    const date = `${unformattedDate[2]}-${unformattedDate[1]}-${unformattedDate[0]}`;
    const picture = $("div.ib_pict img").attr("src");
    const link = $("a").attr("href");
    latestFiveNews.push({
      title,
      description,
      date,
      link: `${baseURL}${link}`,
      picture: `${baseURL}${picture}`,
    });
    console.log(`Parsing completed status - ${i + 1}/${newsLimit}`);
  }
  await browser.close();

  console.log("Writing to db...");
  try {
    await strapi.db.query("api::news-service.news-service").createMany({
      data: latestFiveNews,
    });
    console.log("Writing operation completed successfully!");
    const allNews = await strapi.db
      .query("api::news-service.news-service")
      .findMany();
    const selectedForDeletion = allNews.slice(0, allNews.length - 5);
    if (selectedForDeletion.length && allNews.length > 10) {
      const ids = selectedForDeletion.map((item) => item.id);
      try {
        await strapi.db.query("api::news-service.news-service").deleteMany({
          where: {
            id: {
              $in: ids,
            },
          },
        });
        console.log("Successfully deleted old news!");
      } catch (err) {
        console.log("News service deletion error", err);
      }
    }
  } catch (err) {
    console.log("Writing operation failed!", err);
  }
};

export { getNews };
