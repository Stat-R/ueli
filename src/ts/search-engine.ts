import * as Fuse from "fuse.js";
import { SearchResultItem } from "./search-result-item";
import { CountManager } from "./count-manager";

export class SearchEngine {
    private threshold: number;
    private countManager: CountManager | undefined;

    public constructor(threshold: number, countManager?: CountManager) {
        this.threshold = threshold;
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
            threshold: this.threshold,
        });

        let fuseResults = fuse.search(searchTerm) as any[];

        if (this.countManager !== undefined) {
            fuseResults = this.sortItemsByCount(fuseResults, this.countManager);
        }

        const sortedResult = fuseResults.map((fuseResult): SearchResultItem => {
            return {
                alternativeExecutionArgument: fuseResult.item.alternativeExecutionArgument,
                alternativePrefix: fuseResult.item.alternativePrefix,
                breadCrumb: fuseResult.item.breadCrumb,
                executionArgument: fuseResult.item.executionArgument,
                icon: fuseResult.item.icon,
                name: fuseResult.item.name,
            } as SearchResultItem;
        });

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
