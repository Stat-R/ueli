import { StringHelpers } from "./helpers/string-helpers";
import { SearchResultItem } from "./search-result-item";
import { SearchEngine } from "./search-engine";
import { Icons } from "./icon-manager/icon-manager";
import { Taskbar, App } from "taskbar-node";

export class ProcessInputValidationService {
    public taskbar: Taskbar | undefined;
    private sortThreshold: number;

    constructor(sortThreshold: number) {
        this.sortThreshold = sortThreshold;
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
            return new SearchEngine(this.sortThreshold).search(result, userInput);
        }
    }
}
