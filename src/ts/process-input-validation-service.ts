import { StringHelpers } from "./helpers/string-helpers";
import { Icons } from "./icon-manager/icon-manager";
import { SearchEngine } from "./search-engine";
import { SearchResultItem } from "./search-result-item";
import { Taskbar } from "taskbar-node";
import { app, NativeImage } from "electron";

export class ProcessInputValidationService {
    public taskbar: Taskbar | undefined;
    private searchEngine: SearchEngine;
    private shouldFetchIcon: boolean;

    constructor(nativeIcon: boolean) {
        this.searchEngine = new SearchEngine();
        this.shouldFetchIcon = nativeIcon;
    }

    public async getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        const result = [] as SearchResultItem[];
        userInput = StringHelpers.trimAndReplaceMultipleWhiteSpacesWithOne(userInput);

        if (!this.taskbar) {
            return result;
        }

        const allProcesses = this.taskbar.getAllApps();
        for (const process of allProcesses) {
            let icon: string | undefined;

            if (this.shouldFetchIcon) {
                icon = await this.pathToIcon(process.getProgramPath());
            }

            result.push({
                breadCrumb: [process.getProgramDescription()],
                executionArgument: `HWND:${process.getHWND()}`,
                icon: icon || Icons.PROGRAM,
                name: process.getWindowTitle() || process.getProcessName(),
                tags: [process.getProcessName(), process.getWindowClass()],
            } as SearchResultItem);
        }

        if (!userInput) {
            return result;
        } else {
            return this.searchEngine.search(result, userInput);
        }
    }

    private pathToIcon(iconTarget: string | undefined): Promise<string | undefined> {
        return new Promise<string | undefined>((resolve) => {
            if (!iconTarget) {
                resolve();
                return;
            }

            app.getFileIcon(iconTarget, (error, image: NativeImage) => {
                if (error) {
                    resolve();
                    return;
                }
                resolve(`<image href='${image.toDataURL()}'/>`);
            });
        });
    }
}
