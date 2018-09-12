import { SearchResultItem } from "../search-result-item";
import { Searcher } from "../searcher/searcher";
import * as cheerio from "cheerio";
import * as fetch from "node-fetch";

export class YoutubeSearcher implements Searcher {
    public getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        userInput = userInput.replace("y!", "");
        return new Promise<SearchResultItem[]>((resolve) => {
            fetch.default(`https://youtube.com/results?search_query=${encodeURIComponent(userInput)}`)
                .then((response) => response.text())
                .then((response) => {
                    const $ = cheerio.load(response);

                    const results = $(".yt-lockup-video")
                        .filter((_i, e) => !("data-ad-impressions" in e.attribs));

                    const items = [] as SearchResultItem[];

                    $(results).each((_i, el) => {
                        const title = $(el).find("h3.yt-lockup-title a");
                        const link = title.attr("href");
                        const channel = $(el).find("div.yt-lockup-byline a");

                        const thumbEl = $(el).find("span.yt-thumb-simple img");
                        let thumbLink = thumbEl.attr("src");

                        if (thumbLink.match(/\.gif/)) {
                            thumbLink = thumbEl.attr("data-thumb");
                        }

                        thumbLink = thumbLink.substring(0, thumbLink.indexOf(".jpg") + 4);

                        items.push({
                            breadCrumb: [channel.text()],
                            executionArgument: `https://youtube.com${link}`,
                            icon: `<image href="${thumbLink}" x="0" y="0" width="32" height="32"/>`,
                            name: title.text(),
                        } as SearchResultItem);
                    });

                    resolve(items);
                })
                .catch(() => resolve([]));
        });
    }
}
