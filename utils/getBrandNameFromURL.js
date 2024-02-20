function getBrandNameFromURL(url) {
	const cutValue = "https://olnisa.ru/manufacturers/";
	let result = url.replace(cutValue, "");
	result = result.substring(0, result.indexOf('/'));
	return result;
}

export default getBrandNameFromURL;