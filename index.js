import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockPlugin from "puppeteer-extra-plugin-adblocker";
import { Cluster } from "puppeteer-cluster";
import { executablePath } from "puppeteer";
import { setTimeout as waitTimer } from "timers/promises";
import process from "node:process";
import File from "./util/file.js";
import console from "./util/stackTrace.js";
import getArg from "./util/args.js";
const help = getArg("--help")
if (help) {
  console.show("------------HELP------------");
  console.show(
    'Example command running: npm run start --  --search="Acer Nitro 5" --cep=59104233\n'
  );
  console.show(
    "Command: --search=         (required) (string) (search product in Mercado livre)"
  );
  console.show("Example: --search='Acer nitro 5' \n");
  console.show(
    "Command: --showBrowser=    (optional) (boolean) (default = false) (Show the IDLE Browser running)"
  );
  console.show("Example: --showBrowser=true \n");
  console.show(
    "Command: --cep=         (required) (number) (Set the CEP local to get price of taxes)"
  );
  console.show("Example: --cep=12345678 \n");
  console.show(
    "Command: --allPages=         (optional) (boolean) (default = false) (get all products of paginations)"
  );
  console.show("Example: --allPages=true \n");
  console.show(
    "Command: --wait=         (optional) (number) (ms) (default = 0) (set wait for search product per product)"
  );
  console.show("Example: --wait=5000 (5 seconds) \n");
  process.exit(1);
}

const url = "https://lista.mercadolivre.com.br/@param";
const searchFor =  getArg("--search=");
const showBrowser =getArg("--showBrowser=") || false;
const cep = getArg("--cep=");
const getAllPages = getArg("--allPages=") || false;
const data_stored = [];
const waitForGetPages =  getArg("--wait=") || 0;
(async () => {
  // Configurações
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    monitor: true,
    puppeteerOptions: {
      headless: !showBrowser,
      args: [`--window-size=${1680},${970}`],
    },
  });
  puppeteer.use(StealthPlugin());
  puppeteer.use(AdblockPlugin({ blockTrackers: true }));
  const browser = await puppeteer.launch({
    headless: !showBrowser,
    ignoreHTTPSErrors: true,
    slowMo: 0,
    args: [
      "--window-size=1400,900",
      "--remote-debugging-port=9222",
      "--remote-debugging-address=0.0.0.0", // You know what your doing?
      "--disable-gpu",
      "--disable-features=IsolateOrigins,site-per-process",
      "--blink-settings=imagesEnabled=true",
    ],
    executablePath: executablePath(),
  });
  cluster.on("taskerror", (err, data, willRetry) => {
    if (willRetry) {
      console.warn(
        `Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`
      );
    } else {
      console.error(`Failed to crawl ${data}: ${err.message}`);
    }
  });
  // CRIEI UMA NOVA PAGINA
  const page = await browser.newPage();

  // FUI ATÉ A URL
  await page.goto(url.replace("@param", searchFor));
  //IREI BUSCAR TODOS OS LINKS DOS ELEMENTOS
  const links = await page.$$eval(".ui-search-result__image > a", (el) =>
    el.map((link) => link.href)
  );

  const getAllContentsPages = async () => {
    for (var i = 0; i < links.length; i++) {
      const link = links[i];
      //INDO EM CADA LINK
      if (waitForGetPages > 0) {
        await waitTimer(waitForGetPages);
      }
      cluster.queue({ url: link, i }, async ({ page, data }) => {
        await page.goto(data.url);
        await page.setCookie({
          name: "cp",
          value: `${cep}|1676997401637`,
        });
        await page.reload();
        //ESPERANDO O TITULO FICAR VISIVEL
        await page.waitForSelector(".ui-pdp-title");

        //OBTENDO DADOS QUE QUERO
        const title = await page.$eval(".ui-pdp-title", (el) => el.innerText);
        const price = await page.$eval(".andes-money-amount > meta", (el) =>
          Number(el.attributes.content.value)
        );
        let freteDuration = await page.evaluate(() => {
          let el = document.querySelector(
            ".ui-pdp-media__title > .ui-pdp-family--SEMIBOLD"
          );
          if (!el) {
            el = document.querySelector(
              ".ui-vpp-shipping_summary > .ui-pdp-media__body > .andes-tooltip__trigger > .ui-pdp-media__title > .ui-pdp-family--SEMIBOLD"
            );
          }
          return el ? el.innerText : "Nada";
        });

        // if (freteDuration.includes("juros")) {
        //   freteDuration = await page.$eval(
        //     ".ui-vpp-shipping_summary > .ui-pdp-media__body > .ui-pdp-media__text > .ui-pdp-family--REGULAR",
        //     (el) => el.innerText
        //   );
        //   // i-pdp-media__title
        // }
        let fretePrice = 0;

        const amount = await page.evaluate(() => {
          const el = document.querySelector(
            ".ui-pdp-media__title > .andes-money-amount"
          );
          if (!el) return null;
          return el.innerText;
        });
        if (amount) {
          const gettingAmount = amount.replaceAll("\n", "");

          if (gettingAmount.includes("centavos")) {
            const splitedAmountText = gettingAmount.split("centavos");
            fretePrice = formatMoney(
              splitedAmountText[splitedAmountText.length - 1]
            );
          } else if (gettingAmount.includes("reales")) {
            const splitedAmountText = gettingAmount.split("reales");
            fretePrice = formatMoney(
              splitedAmountText[splitedAmountText.length - 1]
            );
          }
        } else {
          fretePrice = 0;
        }

        const _data = {
          title,
          price,
          frete: { duration: freteDuration, price: fretePrice },
          link: data.url,
        };
        data_stored.push(_data);
        return _data;
        // Store screenshot, do something else
      });
    }
  };

  if (getAllPages) {
    const quantityPages = await page.$eval(
      ".andes-pagination__page-count",
      (el) => {
        return Number(el.innerText.replace(/\D/g, ""));
      }
    );
    const linkPages = await page.$eval(
      ".shops__pagination-link",
      (el) => el.attributes.href.textContent
    );
    const linksSpliteds = linkPages.split("_Desde_");
    let getNumberOfPagination = Number(linksSpliteds[1].replace(/\D/g, "")) - 1;

    for (var i = 1; i < quantityPages; i++) {
      let strin = linksSpliteds[1];
      cluster.queue(i, async ({ page, data }) => {
        await page.goto(
          `${linksSpliteds[0]}_Desde_${strin.replace(
            getNumberOfPagination + 1,
            getNumberOfPagination * data + 1
          )}`
        );
        const links_obtening = await page.$$eval(
          ".ui-search-result__image > a",
          (el) => el.map((link) => link.href)
        );
        links.push(...links_obtening);
        if (data == quantityPages - 1) {
          await getAllContentsPages();
        }
      });
    }
  } else {
    await getAllContentsPages();
  }

  const formatMoney = (n) => {
    n = n.replace("R$", "");
    if (n === "") {
      n = 0;
    } else {
      n = n.split(".").join("");
      n = n.replace(",", ".");
    }
    return Number(n);
  };

  await browser.close();

  //PERCORRENDO CADA LINK

  await cluster.idle();
  await cluster.close();
  //FECHANDO BROWSER
})();
process.on("exit", async (code) => {
  try {
    console.show("Received Signal to Exit");
    const nameFile = `#${new Date().getTime()}.json`;
    const dirFile = `./data/${searchFor} - ${nameFile}`;
    if (data_stored.length == 0) {
      console.show("Not exists data to save in json, skipping...");
    } else {
      console.show("Saved data json file");
      console.show(`File: ${nameFile}`);
      console.show(`Quantity of products: ${data_stored.length}`);
      console.show(`Directory: ${dirFile}`);
      console.show(`Run: npm run statistic --file="${nameFile}" (or --f="${nameFile.replace('.json', '')}")`);
    }
    const file = new File();
    data_stored.length > 0
      ? await file.append(dirFile, JSON.stringify(data_stored, null, 2))
      : null;
  } catch (error) {
    console.trace(error)
  }
});
