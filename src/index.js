const EleventyFetch = require("@11ty/eleventy-fetch");
const Parser = require('rss-parser');

const parser = new Parser();

const getUrl = async (url) => await EleventyFetch(`${url}.json`, {
	duration: "1w",
	type: "json"
});

const getAuthor = async (url) => {
	const author = await getUrl(url);
	
	return author.name;
}

const getBook = async (url) => {
	const bookData = await getUrl(url);

	if (bookData) {
		const authors = await Promise.all(bookData.authors.map(getAuthor));
		
		return {
			title: bookData.title,
			authors,
			description: bookData.description,
			publishedDate: new Date(bookData.publishedDate),
			cover: bookData.cover.url,
		}
	}
}

const getMessage = async (feedItem) => {
	const message = await getUrl(feedItem.link);
	const book = await getBook(message.tag[0].href);

	return {
		book,
		date: new Date(message.published),
		status: feedItem.contentSnippet,
	};
}

module.exports = function(eleventyConfig, options) {
	eleventyConfig.addGlobalData(options.dataKey || "bookwyrm", async () => {
		const prefix = options.domain.startsWith('http') ? "" : "https://";
		const url = `${prefix}${options.domain}/user/${options.user}/rss`;
		const feed = await parser.parseURL(url);
		return await Promise.all(feed.items.map(getMessage));
	});
}