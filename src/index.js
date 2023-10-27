const EleventyFetch = require("@11ty/eleventy-fetch");
const Parser = require('rss-parser');

const parser = new Parser();

const get1hUrl = async (url) => await EleventyFetch(url, {
	duration: "1h",
	type: "json"
});

const getUrl = async (url) => await EleventyFetch(url, {
	duration: "1w",
	type: "json"
});

const getAuthor = async (url) => {
	const author = await getUrl(`${url}.json`);
	
	return author.name;
}

const getBook = async (url) => {
	if (!url) return;

	const bookData = await getUrl(`${url}.json`);

	if (bookData) {
		const authors = await Promise.all(bookData.authors.map(getAuthor));
		
		return {
			id: url,
			title: bookData.title,
			authors,
			description: bookData.description,
			publishedDate: new Date(bookData.publishedDate),
			cover: bookData.cover.url,
		}
	}
}

const getMessage = async (message) => {
	const url = message?.tag?.[0]?.href || message?.inReplyToBook;
	try {
		const book = await getBook(message?.tag?.[0]?.href || message?.inReplyToBook);

		return {
			book,
			date: new Date(message.published),
			status: message.content.replace( /(<([^>]+)>)/ig, ''),
			type: message.rating ? "Review" : "Update",
		};
	} catch (e) {
		console.error(`[eleventy-plugin-bookywyrm] Error occurred when parsing ${url}: ${e.message}`);
	}
}

const getFeed = async (url) => {
	const actorFile = await getUrl(url);
	let feed = [];

	if (actorFile && actorFile.outbox) {
		const outbox = await getUrl(actorFile.outbox);

		if (outbox.first) {
			let page = await get1hUrl(outbox.first);

			while(page.orderedItems.length) {
				feed = feed.concat(await Promise.all(page.orderedItems.map(getMessage)));

				if (page.next) {
					page = await get1hUrl(page.next);
				} else {
					break;
				}
			}
		}
	} else {
		console.error(`No actor file found for ${url}, feed will be empty`);
		return [];
	}


	const books = feed
		.filter(item => item && item.book)
		.reduce((acc, evt) => {
			if (!acc[evt.book.id]) {
				acc[evt.book.id] = {
					book: evt.book,
					events: [],
				}
			}

			acc[evt.book.id].events.push({ status: evt.status, date: evt.date, type: evt.type });
			return acc;
		}, {});

	return Object.values(books)
		.sort((a, b) => b.events[0].date - a.events[0].date);
}

module.exports = function(eleventyConfig, options) {
	eleventyConfig.addGlobalData(options.dataKey || "bookwyrm", async () => {
		const prefix = options.domain.startsWith('http') ? "" : "https://";
		const url = `${prefix}${options.domain}/user/${options.user}.json`;
		return await getFeed(url);
	});
}