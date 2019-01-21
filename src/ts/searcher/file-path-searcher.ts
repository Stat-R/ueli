import { Searcher } from "./searcher";
import { FileHelpers } from "../helpers/file-helpers";
import { Icons } from "../icon-manager/icon-manager";
import { SearchEngine } from "../search-engine";
import { SearchResultItem } from "../search-result-item";
import * as fs from "fs";
import { dirname, basename, extname } from "path";
import { FilePathRegex } from "../helpers/file-path-regex";
import { File, NativeUtil } from "../native-lib";

export class FilePathSearcher implements Searcher {
    public readonly needSort = false;
    public readonly shouldIsolate = false;

    private textEditorName: string;
    private executableExtension: string[];
    private regex: RegExp;
    private cacheFolder: { filePath: string, isRecursive: boolean, result: SearchResultItem[] } | undefined;
    private nativeUtil: NativeUtil;

    constructor(executableExtension: string[], textEditorName: string, nativeUtil: NativeUtil) {
        this.textEditorName = textEditorName;
        this.regex = FilePathRegex.windowsFilePathRegExp;
        this.executableExtension = executableExtension.map((ext) => ext.toLowerCase());
        this.nativeUtil = nativeUtil;
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
                    return this.getFolderSearchResult(filePath);
                }
            } else {
                return this.getFileSearchResult(filePath);
            }
        }

        if (fs.existsSync(dirname(userInput))) {
            filePath = dirname(userInput);
            let searchTerm = basename(userInput);

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

    private getFolderSearchResult(folderPath: string, recursive = false): SearchResultItem[] {
        const result = [] as SearchResultItem[];

        let files: File[] = [];

        if (recursive) {
            files = this.nativeUtil.recursiveIterateFolder(folderPath);
        } else {
            files = this.nativeUtil.iterateFolder(folderPath);
        }

        for (const file of files) {
            if (file.isDir()) {
                result.push({
                    alternativePrefix: this.textEditorName && `Open in ${this.textEditorName}`,
                    breadCrumb: FileHelpers.crumbsToLinkedCrumbs(file.crumbs()),
                    executionArgument: file.path(),
                    icon: Icons.FOLDER,
                    name: file.name(),
                } as SearchResultItem);
            } else {
                const fileName = file.name();
                const prefix = this.isExecutableFile(fileName)
                    ? "Run As Administrator"
                    : undefined;

                result.push({
                    alternativePrefix: prefix,
                    breadCrumb: FileHelpers.crumbsToLinkedCrumbs(file.crumbs()),
                    executionArgument: file.path(),
                    icon: Icons.FILE,
                    name: fileName,
                } as SearchResultItem);
            }
        }

        return result;
    }

    private sortSearchResult(items: SearchResultItem[], searchTerm: string): SearchResultItem[] {
        return new SearchEngine().search(items, searchTerm);
    }

    private getFileSearchResult(filePath: string): SearchResultItem[] {
        const prefix = this.isExecutableFile(filePath) ? "Run As Administrator" : undefined;

        return [
            {
                alternativePrefix: prefix,
                breadCrumb: FileHelpers.filePathToBreadCrumbs(filePath),
                executionArgument: filePath,
                icon: Icons.FILE,
                name: basename(filePath),
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
            const name = basename(item.executionArgument);
            return regExp.test(name);
        });
    }

    private isExecutableFile(input: string): boolean {
        const ext = extname(input).toLowerCase();
        if (this.executableExtension.indexOf(ext) !== -1) {
            return true;
        }

        return false;
    }
}
