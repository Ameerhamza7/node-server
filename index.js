const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8888

app.use(cors());
app.use(bodyParser.json());



const extractItems = async(page)  => {
    let maps_data = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".Nv2PK")).map((el) => {
        const link = el.querySelector("a.hfpxzc").getAttribute("href");
        return {
        title: el.querySelector(".fontHeadlineSmall")?.textContent.trim(),
        avg_rating: el.querySelector(".MW4etd")?.textContent.trim(),
        reviews: el.querySelector(".UY7F9")?.textContent.replace("(", "").replace(")", "").trim(),
        img: el.querySelector(".FQ2IWe img")?.getAttribute('src'),
        address: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:last-child")?.textContent.replaceAll("·", "").trim(),
        description: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(2)")?.textContent.replace("·", "").trim(),
        website: el.querySelector("a.lcr4fd")?.getAttribute("href"),
        category: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:first-child")?.textContent.replaceAll("·", "").trim(),
        timings: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(3) > span:first-child")?.textContent.replaceAll("·", "").trim(),
        phone_num: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(3) > span:last-child")?.textContent.replaceAll("·", "").trim(),
        extra_services: el.querySelector(".qty3Ue")?.textContent.replaceAll("·", "").replaceAll("  ", " ").trim(),
        latitude: link.split("!8m2!3d")[1].split("!4d")[0],
        longitude: link.split("!4d")[1].split("!16s")[0],
        link,
        dataId: link.split("1s")[1].split("!8m")[0],
        };
    });
    });
    return maps_data;
    }

    const scrollPage = async (page, scrollContainer, itemTargetCount) => {
      let items = [];
      let previousHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);
      while (itemTargetCount > items.length) {
          items = await extractItems(page);
          await page.evaluate(async () => {
              await new Promise(resolve => setTimeout(resolve, 6000)); 
          });
          await page.evaluate(`document.querySelector("${scrollContainer}").scrollTo(0, document.querySelector("${scrollContainer}").scrollHeight)`);
      }
      return items;
  }
  
  app.post('/', async (req, res) => {
    const {lat, lng, search}=  req.body
    if( !lat || !lng ){
        res.status(400).json({error: 'Latitude and Longitude are required'})
    }
        try {
            const browser = await puppeteer.launch({
                headless: false,
                args: ["--disabled-setuid-sandbox", "--no-sandbox"],
            });
            const [page] = await browser.pages();
            await page.setExtraHTTPHeaders({
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4882.194 Safari/537.36",
            });
            await page.goto(`https://www.google.com/maps/search/'${search}'/@${lat},${lng},16z/data=!3m1!4b1?entry=ttu`, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });
            const map = await scrollPage(page, ".m6QErb[aria-label]", 10); 
            // await new Promise(resolve => setTimeout(resolve, 6000)); 
            res.send(map); 
        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ error: 'Error fetching data' });
        }
});

app.listen(port, () => {
    console.log(`Api is running on ${port}`);
});


 app.get('/test', (req, res) => {
  
    res.send('Tets API is working');
  });

