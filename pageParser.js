import getBrandName from './utils/getBrandName.js';
import getBrandNameFromURL from './utils/getBrandNameFromURL.js';
import writeFile from "./utils/writeFile.js";
import delay from './utils/delay.js';


const parserObj = {
	url: "https://olnisa.ru/manufacturers/",

	async parser(browser, brandsURLs, startWithBrand = null, startWithPageForBrand = null) {
		// 'startWith' параметр - это строка. Если эта строка есть в адресе, то
		// конечный массив обрезается с его начала и начинается с адреса,
		// который содержит эту строку
		// ['address one', 'address two', 'address three'] => ('two') => ['address two', 'address three']
		// startWithPageForBrand - страница пагинации, с которой начать парсить
		let page = await browser.newPage();
		page.once('domcontentloaded', () => console.info('✅ DOM is ready'));
		page.once('load', () => console.info('✅ Page is loaded'));
		page.setDefaultNavigationTimeout(600000);
		page.setDefaultTimeout(600000);
		let resultObj = {};

		if (startWithBrand) {
			let startIndex = 0;
			for (let el = 0; el < brandsURLs.length; el++) {
				if (brandsURLs[el].toLowerCase().includes(startWithBrand.toLowerCase())) {
					startIndex = el;
					break;
				}
			}
			brandsURLs = brandsURLs.slice(startIndex);
		}

		// открываем каждую ссылку бренда в новом окне
		const brandPagePromise = link => new Promise(async (resolve, reject) => {
			let dataObj = {};
			const newPage = await browser.newPage();
			newPage.setDefaultNavigationTimeout(600000);
			newPage.setDefaultTimeout(600000);
			await newPage.goto(link);
			await newPage.waitForSelector('main h1');
			// dataObj['brandName'] = await newPage.$eval('main h1', text => text.innerText);
			dataObj['brandName'] = getBrandNameFromURL(link);
			// проходим по всем страницами пагинации и возвращаем массив
			const dataContainer = [];
			dataObj['brandData'] = await this.getBrandData(browser, newPage, dataObj.brandName, dataContainer, 1, startWithPageForBrand);
			writeFile(dataObj);
			resolve(dataObj);
			await newPage.close();
		});


		// console.log(`go to ${brandsURLs[0]}...`);
		// resultObj[`${getBrandName(this.url, brandsURLs[0])}`] = await brandPagePromise(brandsURLs[0]);
		// console.log(`go to ${brandsURLs[1]}...`);
		// resultObj[`${getBrandName(this.url, brandsURLs[1])}`] = await brandPagePromise(brandsURLs[1]);
		// console.log(`go to ${brandsURLs[2]}...`);
		// resultObj[`${getBrandName(this.url, brandsURLs[2])}`] = await brandPagePromise(brandsURLs[2]);

		// console.log(resultObj);

		// проходим по всем брендам
		for (let brandURL of brandsURLs) {
			console.log(`go to ${brandURL}...`);
			resultObj[`${getBrandName(this.url, brandURL)}`] = await brandPagePromise(startWithPageForBrand ? `${brandURL}page-${startWithPageForBrand}` : brandURL);
		}

		return resultObj;
	},

	async getBrandLinks(browser) {
		const page = await browser.newPage();
		page.once('domcontentloaded', () => console.info('✅ DOM is ready'));
		page.once('load', () => console.info('✅ Page is loaded'));
		page.setDefaultNavigationTimeout(600000);

		console.log(`go to ${this.url}`);
		await page.goto(this.url);
		await page.waitForSelector('.row.pag');
		// берём все ссылки на бренды
		let urls = await page.$$eval('.row.pag > a', i => i.map(el => el.href));

		page.close();

		return urls;
	},

	async getBrandData(browser, page, brandName, dataContainer, pageNumber, startWithPage) {
		if (startWithPage) {
			console.log(`ПЕРЕНАЗНАЧЕНИЕ НОМЕРА СТРАНИЦЫ на номер ${startWithPage}.`);
			pageNumber = startWithPage;
			startWithPage = null;
		}

		try {
			await page.waitForSelector('[itemprop="model"] > a');
		} catch (err) {
			console.log("Не дождались селектор '[itemprop=\"model\"] > a'");
			console.log(`Возвращаем то, что спарсили для бренда ${brandName}`);
			return dataContainer;
		}

		// собираем все ссылки с текущей страницы
		const pageLinks = await page.$$eval('[itemprop="model"] > a', el => el.map(i => i.href));
		// console.log(pageLinks);


		const paginationPromise = link => new Promise(async (resolve, reject) => {
			let dataItemObj = {};

			try {
				const newPage = await browser.newPage();
				newPage.setDefaultNavigationTimeout(600000);
				newPage.setDefaultTimeout(600000);
				await newPage.goto(link);

				const modelSelector = '[itemprop="model"]';
				await newPage.waitForSelector(modelSelector);
				dataItemObj["model"] = await newPage.$eval(modelSelector, el => el.innerText);

				const brandSelector = '[itemprop="brand"]';
				await newPage.waitForSelector(brandSelector);
				dataItemObj["brand"] = await newPage.$eval(brandSelector, el => el.innerText);

				const descSelector = '[itemprop="description"]';
				await newPage.waitForSelector(descSelector);
				dataItemObj["desc"] = await newPage.$eval(descSelector, text => {
					const elements = [...text.querySelectorAll('p')];
					const phrases = elements.filter(el => el.innerText.length > 0).map(el => el.innerText).join(' ');
					return phrases;
				});
				resolve(dataItemObj);
				await newPage.close();

			} catch (err) {
				reject(dataItemObj);
				throw new Error("Ошибка: ", err);
			}
		});

		// каждую ссылку страницы открываем в новом окне и парсим данные
		let k = 1;
		for (let link of pageLinks) {
			let currentItemData;

			try {
				console.log(`Бренд: ${brandName}, страница: ${pageNumber} -->>  Номер на листе: ${k++}, Адрес товара: ${link}`);
				currentItemData = await paginationPromise(link);
				dataContainer.push(currentItemData);
			} catch (err) {
				console.log(`Ошибка парсинга данных со страницы ${link}. Описание ошибки: ${err}`);
				dataContainer.push(currentItemData);
				return dataContainer;
			}
		}

		let nextButtonExist = false;
		try {
			const nextButton = await page.$eval('.page_link.next', a => a.textContent);
			// console.log(`Кнопка 'next' существует на странице ${pageNumber}.`);
			// если предыдущая строка не вызвала ошибки, то придём на нижнюю строку и установим true
			nextButtonExist = true;
		}
		catch (err) {
			console.log(`Кнопка 'next' НЕ существует на странице ${pageNumber}.`);
			nextButtonExist = false;
		}


		if (nextButtonExist) {
			pageNumber++;
			// await page.hover('.page_link.next');
			// console.log("Задержка после наведения на кнопку next...");
			// await delay(5000);
			await page.click('.page_link.next');
			await page.waitForSelector('[itemprop="model"] > a');

			if (page.url().includes(`page-${pageNumber}`)) {
				console.log(`== page URL: ${page.url()} ==`);
				return this.getBrandData(browser, page, brandName, dataContainer, pageNumber);
			} else {
				console.log(`Неверная пагинация страницы: текущая страница -> ${page.url()}, а pageNumber=${pageNumber}`);
				console.log(`Попытка ещё раз зайти на адрес страницы...`);
				// ещё раз ждём, правильной страницы
				if (!page.url().includes(`page-${pageNumber}`)) {
					// ещё раз ждём...
					await delay(2000);
					// если всё-таки не дождались, делаем ещё одну попытку
					// перейти на страницу
					await page.click('.page_link.next');
					try {
						// ждём селектор на новой странице
						await page.waitForSelector('[itemprop="model"] > a');
					} catch (err) {
						// если не дождались, то возвращаем то, что уже
						// спарсили для данного бренда
						return dataContainer;
					}

				}
			}
		}

		return dataContainer;
	},
}



export default parserObj;