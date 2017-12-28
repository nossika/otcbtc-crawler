const puppeteer = require('puppeteer');
class Crawler {
    constructor ({ interval = 30000 }) {
        this._callbacks = new Set();
        this.start(interval);
    }
    subscribe (fn) {
        if (typeof fn !== 'function') throw new TypeError('invalid function');
        this._callbacks.add(fn);
        return {
            unsubscribe: () => {
                this._callbacks.delete(fn);
            }
        }
    }
    async start (interval) {
        let browser = await puppeteer.launch({
            // executablePath: '/Users/S/Desktop/chrome-win32/chrome.exe', // chromium path
            // headless: false, // launch a visible browser
        });
        this._browser = browser;
        clearInterval(this._timer);
        this._timer = setInterval(async () => {
            async function getSellInfo () {
                let page = await browser.newPage();
                await page.goto('https://otcbtc.com/sell_offers?currency=eos&fiat_currency=cny&payment_type=all');
                let sellInfo = await page.evaluate(() => {
                    let sellEl = document.querySelector('.show-solution-box-normal .recommend-card');
                    let price = +document.querySelector('.current-rate span.price:nth-child(4)').innerText.match(/\d*\.?\d*/g)[0];
                    let sell = {
                        price: +sellEl.querySelector('.recommend-card__price').innerText,
                        link: 'https://otcbtc.com' + sellEl.querySelector('.recommend-card__action a').getAttribute('href')
                    };
                    return {
                        price,
                        sell
                    }
                });
                page.close();
                return sellInfo;

            }
            async function getBuyInfo () {
                let page = await browser.newPage();
                await page.goto('https://otcbtc.com/buy_offers?currency=eos&fiat_currency=cny&payment_type=all');
                let buyInfo = await page.evaluate(() => {
                    let buyEl = document.querySelector('.show-solution-box-normal .recommend-card');
                    let buy = {
                        price: +buyEl.querySelector('.recommend-card__price').innerText,
                        link: 'https://otcbtc.com' + buyEl.querySelector('.recommend-card__action a').getAttribute('href')
                    };
                    return {
                        buy
                    }
                });
                page.close();
                return buyInfo;
            }
            let [sellInfo, buyInfo] = await Promise.all([getSellInfo(), getBuyInfo()]);
            let info = Object.assign({}, sellInfo, buyInfo);
            try {
                for (let fn of this._callbacks) {
                    fn(info);
                }
            } catch (e) {

            }
        }, interval);
    }
    async stop () {
        clearInterval(this._timer);
        this._callbacks.clear();
        this._browser && await this._browser.close();
    }
}

module.exports = Crawler;