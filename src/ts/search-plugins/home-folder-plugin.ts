import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FileHelpers } from "../helpers/file-helpers";
import { SearchResultItem } from "../search-result-item";
import { SearchPlugin } from "./search-plugin";
import { Icons } from "../icon-manager/icon-manager";

export class HomeFolderSearchPlugin implements SearchPlugin {
    private homeFolderPath = os.homedir();

    public async getAllItems(): Promise<SearchResultItem[]> {
        const allPromises = await this.getFilesAndFolders()
                .then((promises) => promises.map((promise) => promise.catch(() => null)));
        const results = await Promise.all(allPromises);
        if (results && results.length > 0) {
            return results.filter((r): r is SearchResultItem => r !== null);
        }
        return [];
    }

    private async getFilesAndFolders(): Promise<Array<Promise<SearchResultItem>>> {
        const filesPending = FileHelpers.getFilesFromFolder({
            breadCrumb: ["Home"],
            fullPath: this.homeFolderPath,
        });

        return filesPending
            .then((files) => files
                .map((f) => new Promise<SearchResultItem>((resolve, reject) => {
                    fs.lstat(f.fullPath, (error, stats) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve({
                            breadCrumb: f.breadCrumb,
                            executionArgument: f.fullPath,
                            icon: stats.isDirectory()
                                ? Icons.FOLDER
                                : Icons.FILE,
                            name: path.basename(f.fullPath),
                            tags: [],
                        } as SearchResultItem);
                    });
                })));
    }
}
