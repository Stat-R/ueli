import { StringHelpers } from "./helpers/string-helpers";
import { Icons } from "./icon-manager/icon-manager";
import { SearchEngine } from "./search-engine";
import { SearchResultItem } from "./search-result-item";
import { App, Taskbar } from "taskbar-node";

export class ProcessInputValidationService {
    public taskbar: Taskbar | undefined;
    private searchEngine: SearchEngine;

    constructor() {
        this.searchEngine = new SearchEngine(0.4);
    }

    public getSearchResult(userInput: string): SearchResultItem[] {
        let result = [] as SearchResultItem[];
        userInput = StringHelpers.trimAndReplaceMultipleWhiteSpacesWithOne(userInput);

        if (!this.taskbar) {
            return [];
        }

        const allApps = this.taskbar.getAllApps();

        result = allApps.map((app: App) => ({
            breadCrumb: [app.getProgramDescription()],
            executionArgument: `HWND:${app.getHWND()}`,
            icon: Icons.PROGRAM,
            name: app.getWindowTitle() || app.getProcessName(),
            tags: [app.getProcessName(), app.getWindowClass()],
        } as SearchResultItem));

        if (!userInput) {
            return result;
        } else {
            return this.searchEngine.search(result, userInput);
        }
    }
}
