// Содержит скрипт, который запускает браузер с нужными настройками

import puppeteer from "puppeteer";

async function startBrowser() {
	let browser;

	try {
		const browserOptions = {
			headless: true,
			// headless: false,
			args: [
				// '--window-position=0,0',
				'--window-position=-800,0',
				'--window-size=800,900',
				'--disable-setuid-sandbox',
			],
			defaultViewport: { width: 800, height: 900 },
			ignoreHTTPSErrors: true,
			// slowMo: 50
		}
		browser = await puppeteer.launch(browserOptions);
	} catch (err) {
		console.log('\n<<<- Не могу создать экземпляр браузера ->>>', err);
	}

	return browser;
}


export default startBrowser;