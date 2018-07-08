import { StringHelpers } from "./helpers/string-helpers";
import { SearchResultItem } from "./search-result-item";
import { Taskbar } from "taskbar-node";
import { SearchEngine } from "./search-engine";
import { Icons } from "./icon-manager/icon-manager";
import { App } from "../../../taskbar-node/lib-types";

export class ProcessInputValidationService {
    private getAllApps: () => App[];
    private sortThreshold: number;

    constructor(getAllApps: () => App[], sortThreshold: number) {
        this.getAllApps = getAllApps;
        this.sortThreshold = sortThreshold;
    }

    public getSearchResult(userInput: string): SearchResultItem[] {
        let result = [] as SearchResultItem[];
        userInput = StringHelpers.trimAndReplaceMultipleWhiteSpacesWithOne(userInput);

        const allApps = this.getAllApps();

        result = allApps.map((app) => ({
            breadCrumb: [app.getProgramDescription()],
            executionArgument: `HWND:${app.getHWND()}`,
            icon: Icons.PROGRAM,
            name: app.getWindowTitle() || app.getProgramDescription(),
            tags: [app.getProcessName(), app.getWindowClass()],
        }) as SearchResultItem);

        if (!userInput) {
            return result;
        } else {
            return new SearchEngine(this.sortThreshold).search(result, userInput);
        }
    }
}
