# eleventy-plugin-bookwyrm

A simple plugin that, given a BookWyrm username & instance URL, will add global data to your Eleventy configuration with a parsed form of the user's outbox.

## Usage

```javascript
const bookwyrmFeed = require('eleventy-plugin-bookwyrm');

module.exports = function (eleventyConfig) {
	// Pass the username and domain separately
	// e.g. if you are p.blart@bookwyrm.social, user is p.blart,
	// and the domain is bookwyrm.social
	eleventyConfig.addPlugin(bookwyrmFeed, {
		user: 'username',
		domain: 'instancedomain.com',
		dataKey: "readinglist" // Optional, defaults to "bookwyrm"
	});
}
```

This adds a new Global Data entry called `readinglist`, which contains an array with the following properties:

```javascript
{
	date: Date,
	status: string,
	book: {
		title: string,
		authors: string[],
		description: string,
		publishedDate: Date,
		cover: string,
	}
}
```

e.g.

```json
[
	{
	"book": {
		"title": "NOS4A2",
		"authors": [
		"Joe Hill"
		],
		"description": "",
		"publishedDate": "2013-10-15T00:00:00.000Z",
		"cover": "https://bookrastinating.com/images/covers/eae4779a-bafd-4514-aa2c-28356ca60b7d.jpeg"
	},
	"events": [
			{
				"date": "2022-12-06T09:28:16.043Z",
				"status": "Lewis finished reading \"NOS4A2\""
			}
		]
	}
]
```

Paste the following code in your template to display available data as stringified JSON objects:

```
{% for data in readinglist %}
{{ data | dump }}<br/><br/><br/>
{% endfor %}
```
