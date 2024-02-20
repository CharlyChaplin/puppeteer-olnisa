// Контроль процесса парсинга.

import parserObj from "./pageParser.js";
import getBrandsArr from './utils/manufactures.js';





async function parseAll(browserInstance) {
	let browser;

	try {
		browser = await browserInstance;
		let brandLinks = [];
		// закомментировать, если хотим сделать запрос с сайта
		// brandLinks = getBrandsArr();
		//-----------------------------------------------------------------

		// собираем ссылки всех брендов
		console.log('Собираем ссылки всех брендов...');
		if (!brandLinks.length) {
			brandLinks = await parserObj.getBrandLinks(browser);
		}
		console.log('Сбор ссылок всех брендов закончен.');

		// отдаём парсеру экземпляр браузера и все ссылки на бренды
		// await parserObj.parser(browser, brandLinks, 'siemens', 3);
		await parserObj.parser(browser, brandLinks);

		//-----------------------------------------------------------------
		console.log("\n<<<- Парсинг завершён. Браузер закрыт. ->>>");
		browser.close();


	} catch (err) {
		console.log("\n<<<- Не могу создать экземпляр браузера. ->>>", err);
	}
}

export default (browserInstance) => parseAll(browserInstance);