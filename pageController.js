const pageScraper = require('./pageScraper');

const scrapeAll = async(browserInstance) => {
  let browser;
  try {
    browser = await browserInstance;
    // await pageScraper.scraper(browser);
    const data = await pageScraper.scraper(browser);
    console.log(data);
  } catch(err) {
    console.log('Could not resolve the browser instance => : ', err);
  }
};

module.exports = (browserInstance) => scrapeAll(browserInstance);