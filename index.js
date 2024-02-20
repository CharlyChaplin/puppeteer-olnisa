import startBrowser from "./browser.js";
import pageController from "./pageController.js";

// создаём экземпляр браузера ...
const browserInstance = startBrowser();

// ... и передаём его в контроллер, который будет управлять его действиями
pageController(browserInstance);