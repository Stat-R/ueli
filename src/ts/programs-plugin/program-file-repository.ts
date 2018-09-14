import { Program } from "./program";
import { ProgramRepository } from "./program-repository";
import { FileHelpers } from "../helpers/file-helpers";
import { StringHelpers } from "../helpers/string-helpers";
import * as path from "path";

export class ProgramFileRepository implements ProgramRepository {
    private appExtensions: string[];
    private appFolder: [string, string];
    private keywordBlacklist: string[];

    public constructor(applicationFolder: [string, string], applicationFileExtensions: string[], keywordBlacklist: string[]) {
        this.appExtensions = applicationFileExtensions;
        this.appFolder = applicationFolder;
        this.keywordBlacklist = keywordBlacklist.map((item) => item.toLowerCase());
    }

    public getPrograms(): Promise<Program[]> {
        return new Promise((resolve, reject) => {
            const result = [] as Program[];

            FileHelpers.getFilesFromFolderRecursively({
                breadCrumb: [FileHelpers.toHTML(this.appFolder[0], this.appFolder[1])],
                fullPath: this.appFolder[0],
            })
                .then((files) => {
                    for (const file of files) {
                        let baseName = path.basename(file.fullPath);

                        for (const extension of this.appExtensions) {
                            if (baseName.endsWith(extension)) {
                                baseName = baseName.replace(extension, "");

                                if (!this.shouldIgnore(baseName)) {
                                    result.push({
                                        breadCrumb: file.breadCrumb,
                                        executionArgument: file.fullPath,
                                        name: baseName,
                                    } as Program);
                                }

                                break;
                            }
                        }
                    }
                    resolve(result);
                })
                .catch(() => reject());
        });
    }

    private shouldIgnore(name: string) {
        const words = StringHelpers.stringToWords(name.toLowerCase());

        for (const keyword of this.keywordBlacklist) {
            if (words.indexOf(keyword) !== -1) {
                return true;
            }
        }
        return false;
    }
}
