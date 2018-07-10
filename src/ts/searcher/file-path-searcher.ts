import * as fs from "fs";
import * as path from "path";
import { FileHelpers } from "../helpers/file-helpers";
import { SearchEngine } from "../search-engine";
import { SearchResultItem } from "../search-result-item";
import { Searcher } from "./searcher";
import { DirectorySeparator } from "../directory-separator";
import { Icons } from "../icon-manager/icon-manager";

export class FilePathSearcher implements Searcher {
    public readonly needSort = false;
    private sortThreshold: number;
    private textEditorName: string;

    constructor(sortThreshold: number, textEditorName: string) {
        this.sortThreshold = sortThreshold;
        this.textEditorName = textEditorName;
    }

    public async getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        let filePath;

        if (fs.existsSync(userInput)) {
            filePath = userInput;
            const stats = fs.lstatSync(filePath);
            if (stats.isDirectory()) {
                return await this.getFolderSearchResult(filePath);
            } else {
                return this.getFileSearchResult(filePath);
            }
        } else if (fs.existsSync(path.dirname(userInput))) {
            filePath = path.dirname(userInput);
            const searchTerm = path.basename(userInput);

            return await this.getFolderSearchResult(filePath, searchTerm, /[\*\?\[\]]/.test(searchTerm));
        }

        return [];
    }

    private async getFolderSearchResult(folderPath: string, searchTerm?: string, wildCard = false): Promise<SearchResultItem[]> {
        const result = [] as SearchResultItem[];

        const crumbs = folderPath.split(DirectorySeparator.WindowsDirectorySeparator);
        if (!crumbs[crumbs.length - 1]) {
            crumbs.length = crumbs.length - 1;
        }

        const files = await FileHelpers.getFilesFromFolder({
            breadCrumb: crumbs,
            fullPath: folderPath,
        });

        for (const file of files) {
            let isDir: boolean;
            try {
                isDir = fs.lstatSync(file.fullPath).isDirectory();
            } catch (_e) {
                continue;
            }

            if (isDir) {
                result.push({
                    alternativePrefix: this.textEditorName && `Open in ${this.textEditorName}`,
                    breadCrumb: file.breadCrumb,
                    executionArgument: file.fullPath,
                    icon: Icons.FOLDER,
                    name: path.basename(file.fullPath),
                    tags: [],
                } as SearchResultItem);
            } else {
                result.push({
                    alternativePrefix: "Run As Administrator",
                    breadCrumb: file.breadCrumb,
                    executionArgument: file.fullPath,
                    icon: Icons.FILE,
                    name: path.basename(file.fullPath),
                    tags: [],
                } as SearchResultItem);
            }
        }

        return searchTerm === undefined
            ? result
            : (wildCard
            ? this.filterWildcard(result, searchTerm)
            : this.sortSearchResult(result, searchTerm));
    }

    private sortSearchResult(items: SearchResultItem[], searchTerm: string): SearchResultItem[] {
        const searchEngine = new SearchEngine(this.sortThreshold);
        return searchEngine.search(items, searchTerm);
    }

    private getFileSearchResult(filePath: string): SearchResultItem[] {
        return [
            {
                breadCrumb: filePath.split(DirectorySeparator.WindowsDirectorySeparator),
                executionArgument: filePath,
                icon: Icons.FILE,
                name: path.basename(filePath),
                tags: [],
            } as SearchResultItem,
        ];
    }

    private filterWildcard(items: SearchResultItem[], searchTerm: string): SearchResultItem[] {
        searchTerm = `^${searchTerm.replace(/\./, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".")}$`;
        const regExp = new RegExp(searchTerm);
        return items.filter((item) => {
            const name = path.basename(item.executionArgument);
            return regExp.test(name);
        });
    }
}
