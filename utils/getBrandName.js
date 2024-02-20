function getBrandName(cut, url) {
	return url.replace(cut, '').replace('/', '');
}

export default getBrandName;