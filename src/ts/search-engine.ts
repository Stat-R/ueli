import { CountManager } from "./count-manager";
import { SearchResultItem } from "./search-result-item";
import * as Fuse from "fuse.js";

export class SearchEngine {
    private countManager: CountManager | undefined;

    public constructor(countManager?: CountManager) {
        this.countManager = countManager;
    }

    public search(unsortedSearchResults: SearchResultItem[], searchTerm: string): SearchResultItem[] {
        const fuse = new Fuse(unsortedSearchResults, {
            distance: 100,
            includeScore: true,
            keys: ["name", "tags"],
            location: 0,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            shouldSort: true,
            threshold: 0.4,
        });

        let fuseResults = fuse.search<{
            item: SearchResultItem;
            score: number;
        }>(searchTerm);

        if (this.countManager !== undefined) {
            fuseResults = this.sortItemsByCount(fuseResults, this.countManager);
        }

        const sortedResult = fuseResults.map((fuseResult) => fuseResult.item);

        return sortedResult;
    }

    private sortItemsByCount(searchResults: any[], countManager: CountManager): any[] {
        const count = countManager.getCount();

        // tslint:disable-next-line:prefer-for-of because we need to change the array itself
        for (let i = 0; i < searchResults.length; i++) {
            const score = count[searchResults[i].item.executionArgument];

            if (score !== undefined && score > 4) {
                searchResults[i].score /= (score * 0.25);
            }
        }

        searchResults = searchResults.sort((a, b) => {
            return a.score - b.score;
        });

        return searchResults;
    }
}
