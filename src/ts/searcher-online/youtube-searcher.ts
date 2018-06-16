import { SearcherOnline } from "./searcher";
import { SearchResultItem } from "../search-result-item";
import * as cheerio from "cheerio";
import * as fetch from "node-fetch";

export class YoutubeSearcher implements SearcherOnline {
    public getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        return new Promise<SearchResultItem[]>((resolve) => {
            fetch.default(`https://youtube.com/results?search_query=${encodeURIComponent(userInput)}`)
                .then((response) => response.text())
                .then((response) => {
                    const $ = cheerio.load(response);

                    const results = $(".yt-lockup-video")
                        .filter((i, e) => !("data-ad-impressions" in e.attribs));

                    const items = [] as SearchResultItem[];

                    $(results).each((i, el) => {
                        const title = $(el).find("h3.yt-lockup-title a");
                        const link = title.attr("href");
                        const channel = $(el).find("div.yt-lockup-byline a");

                        items.push({
                            breadCrumb: [channel.text()],
                            executionArgument: `https://youtube.com${link}`,
                            icon: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" version="1.1">
                                        <g id="surface1">
                                            <path d=" M 28.383 9.108 C 28.043 7.634 26.838 6.546 25.386 6.384 C 21.948 6 18.468 5.998 15.004 6 C 11.54 5.998 8.06 6 4.622 6.384 C 3.171 6.546 1.966 7.634 1.627 9.108 C 1.143 11.208 1.138 13.5 1.138 15.662 C 1.138 17.824 1.138 20.116 1.621 22.215 C 1.96 23.689 3.165 24.777 4.617 24.94 C 8.055 25.324 11.535 25.326 14.999 25.324 C 18.464 25.326 21.943 25.324 25.38 24.94 C 26.831 24.777 28.037 23.689 28.377 22.215 C 28.86 20.115 28.862 17.824 28.862 15.662 C 28.862 13.5 28.866 11.208 28.383 9.108 Z  M 11.422 19.965 C 11.422 16.898 11.422 13.864 11.422 10.797 C 14.361 12.33 17.279 13.853 20.236 15.395 C 17.288 16.924 14.368 18.437 11.422 19.965 Z "></path>
                                        </g>
                                    </svg>`,
                            name: title.text(),
                            tags: [],
                        } as SearchResultItem);
                    });

                    resolve(items);
                });
        });
    }
}
