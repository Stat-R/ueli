import { Searcher } from "./searcher";
import { FileHelpers, FancyFile } from "../helpers/file-helpers";
import { Icons } from "../icon-manager/icon-manager";
import { SearchEngine } from "../search-engine";
import { SearchResultItem } from "../search-result-item";
import * as fs from "fs";
import * as path from "path";
import { FilePathRegex } from "../helpers/file-path-regex";

export class FilePathSearcher implements Searcher {
    public readonly needSort = false;
    public readonly shouldIsolate = false;

    private textEditorName: string;
    private executableExtension: string[];
    private regex: RegExp;
    private cacheFolder: { filePath: string, isRecursive: boolean, result: SearchResultItem[] } | undefined;

    constructor(executableExtension: string[], textEditorName: string) {
        this.textEditorName = textEditorName;
        this.regex = FilePathRegex.windowsFilePathRegExp;
        this.executableExtension = executableExtension.map((ext) => ext.toLowerCase());
    }

    public async getSearchResult(userInput: string, cwd: string | undefined): Promise<SearchResultItem[]> {
        const isValidPath = this.regex.test(userInput);

        if (!isValidPath && cwd) {
            userInput = `${cwd}${userInput}`;
        }

        let filePath;

        if (fs.existsSync(userInput)) {
            filePath = userInput;
            const stats = fs.lstatSync(filePath);
            if (stats.isDirectory()) {
                if (userInput.endsWith("\\")) {
                    return await this.getFolderSearchResult(filePath);
                }
            } else {
                return this.getFileSearchResult(filePath);
            }
        }

        if (fs.existsSync(path.dirname(userInput))) {
            filePath = path.dirname(userInput);
            let searchTerm = path.basename(userInput);

            const isRecursive = searchTerm.startsWith(":");
            if (isRecursive) {
                searchTerm = searchTerm.slice(1);
            }

            const isWildcard = /[*?]/.test(searchTerm);

            let result: SearchResultItem[] = [];
            if (this.cacheFolder !== undefined &&
                filePath === this.cacheFolder.filePath &&
                isRecursive === this.cacheFolder.isRecursive
            ) {
                result = this.cacheFolder.result;
            } else {
                result = await this.getFolderSearchResult(filePath, isRecursive);
                this.cacheFolder = {
                    filePath,
                    isRecursive,
                    result,
                };
            }

            return (isWildcard
                ? this.filterWildcard(result, searchTerm)
                : this.sortSearchResult(result, searchTerm));
        }

        return [];
    }

    private async getFolderSearchResult(folderPath: string, recursive = false): Promise<SearchResultItem[]> {
        const result = [] as SearchResultItem[];

        let files: FancyFile[] = [];

        if (recursive) {
            files = await FileHelpers.getFilesFromFolderRecursively({
                breadCrumb: FileHelpers.filePathToBreadCrumbs(folderPath),
                fullPath: folderPath,
            });
        } else {
            files = await FileHelpers.getFilesFromFolder({
                breadCrumb: FileHelpers.filePathToBreadCrumbs(folderPath),
                fullPath: folderPath,
            });
        }

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
                } as SearchResultItem);
            } else {
                let prefix = "";
                const fileExt = path.extname(file.fullPath).toLowerCase();
                if (this.executableExtension.indexOf(fileExt) !== -1) {
                    prefix = "Run As Administrator";
                }
                result.push({
                    alternativePrefix: prefix,
                    breadCrumb: file.breadCrumb,
                    executionArgument: file.fullPath,
                    icon: Icons.FILE,
                    name: path.basename(file.fullPath),
                } as SearchResultItem);
            }
        }

        return result;
    }

    private sortSearchResult(items: SearchResultItem[], searchTerm: string): SearchResultItem[] {
        const searchEngine = new SearchEngine();
        return searchEngine.search(items, searchTerm);
    }

    private getFileSearchResult(filePath: string): SearchResultItem[] {
        let prefix = "";
        const fileExt = path.extname(filePath).toLowerCase();
        if (this.executableExtension.indexOf(fileExt) !== -1) {
            prefix = "Run As Administrator";
        }

        return [
            {
                alternativePrefix: prefix,
                breadCrumb: FileHelpers.filePathToBreadCrumbs(filePath),
                executionArgument: filePath,
                icon: Icons.FILE,
                name: path.basename(filePath),
            } as SearchResultItem,
        ];
    }

    private filterWildcard(items: SearchResultItem[], searchTerm: string): SearchResultItem[] {
        searchTerm = `^${searchTerm
            .replace(/([.\[\](){}\-+|^$!=,])/g, (_, sym: string) => `\\${sym}`)
            .replace(/\*/g, ".*")
            .replace(/\?/g, ".")
        }$`;
        const regExp = new RegExp(searchTerm);
        return items.filter((item) => {
            const name = path.basename(item.executionArgument);
            return regExp.test(name);
        });
    }
}
