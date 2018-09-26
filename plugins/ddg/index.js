// @ts-check
/// <reference path="index.d.ts" />

const cheerio = require("cheerio");
const { get } = require('http');

const PREFIX = "dd!"

module.exports.onlineSearcher = class Searcher {
    constructor() {
        this.needSort = false;
        this.shouldIsolate = true;
    }

    /**
     *
     * @param {string} userInput
     * @returns {Promise<SearchResultItem[]>}
     */
    getSearchResult(userInput) {
        const input = userInput.replace(PREFIX, "");
        return new Promise((resolve, reject) => {
            get(`http://duckduckgo.com/lite/?q=${encodeURIComponent(input)}&kd=-1`, (res) => {
                let body = '';

                res.on('error', (err) => reject(err));

                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    const $ = cheerio.load(body);
                    const rawResults = $("tr");
                    const headers = rawResults.find("a");
                    const descriptions = rawResults.find(".result-snippet");
                    const results = [];
                    for (let i = 0; i < headers.length; i++) {
                        results.push({
                            breadCrumb: [$(descriptions[i]).text()],
                            executionArgument: $(headers[i]).attr("href"),
                            icon: "getURLIcon",
                            name: $(headers[i]).text(),
                        })
                    }
                    resolve(results);
                });
            });
        });
    }
}

module.exports.inputValidator = class Validator {
    /**
     *
     * @param {string} input
     * @returns {boolean} whether input is valid to start to get search results
     */
    isValidForSearchResults(input) {
        return input.startsWith(PREFIX);
    }

    /**
     *
     * @param {string} userInput
     * @returns {string[]} [Prefix symbols, prefix trimmed input, ...scopes[]]
     */
    getScopes(userInput) {
        const trimmed = userInput.substr(PREFIX.length);
        return [PREFIX, trimmed, "DuckDuckGo"];
    }
}
