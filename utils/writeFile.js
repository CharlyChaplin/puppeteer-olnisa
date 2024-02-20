import fs from 'fs';

function writeFile(data) {
	fs.writeFileSync(`./brandsData/${data.brandName}.json`, JSON.stringify(data), 'utf-8', err => {
		if (err) throw new Error("Error = ", err);
		console.log("Data saved.");
	});
}

export default writeFile;