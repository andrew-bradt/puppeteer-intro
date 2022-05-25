const scraperObject = {
  url: 'http://books.toscrape.com',
  scraper: async function (browser) {
    let num = 1;
    const page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);

    await page.goto(this.url);
    
    const scrapedData = [];

    const scrapeCurrentPage = async () => {
      console.log(`------------------------------------------------------------------------------------------------Scraping page ${num}...`);
      await page.waitForSelector('.page_inner');

      const urls = await page.$$eval('section ol > li', (listItems) => {
        const itemsInStock = listItems.filter(el => el.querySelector('.instock.availability').textContent.includes('In stock'));
        const hrefs = itemsInStock.map(el => el.querySelector('h3 > a').href);
        return hrefs;
      });
      
      const pagePromise = (link) => new Promise(async(resolve, reject) => {
        const dataObj = {};
        const newPage = await browser.newPage();
        await newPage.goto(link);
  
        dataObj.bookTitle = await newPage.$eval('.product_main > h1', text => text.textContent);
        dataObj.bookPrice = await newPage.$eval('.price_color', text => text.textContent);
        dataObj.noAvailable = await newPage.$eval('.instock.availability', text => {
          const strippedText = text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, '');
          const regexp = /^.*\((.*)\).*$/i;
          const stockAvailable = regexp.exec(strippedText)[1].split(' ')[0];
          return stockAvailable;
        });
        dataObj.imageUrl = await newPage.$eval('#product_gallery img', img => img.src);

        try {
          dataObj.bookDescription = await newPage.$eval('#product_description', div => div.nextSibling.nextSibling.textContent);
        } catch (err) {
          dataObj.bookDescription = null;
        }
        
        dataObj.upc = await newPage.$eval('.table.table-striped > tbody > tr > td', table => table.textContent);
        resolve(dataObj);
        await newPage.close();
      });
  
      for await (const link of urls) {
        const currentPageData = await pagePromise(link);
        scrapedData.push(currentPageData);
      }

      let nextButtonExists = false;
      try {
        await page.$eval('.next > a', a => a.textContent);
        nextButtonExists = true;
        num++;
      } catch (err) {
        nextButtonExists = false;
      }
      if (nextButtonExists) {
        await page.click('.next > a');
        return scrapeCurrentPage();
      }
      await page.close();
    };
    
    await scrapeCurrentPage();
    return scrapedData;
  }
}

module.exports = scraperObject;
    
    