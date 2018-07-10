import * as path from "path";
import { FileHelpers } from "../helpers/file-helpers";
import { Program } from "./program";
import { ProgramRepository } from "./program-repository";

export class ProgramFileRepository implements ProgramRepository {
    private appExtensions: string[];
    private appFolder: [string, string];
    public constructor(applicationFolder: [string, string], applicationFileExtensions: string[]) {
        this.appExtensions = applicationFileExtensions;
        this.appFolder = applicationFolder;
    }

    public getPrograms(): Promise<Program[]> {
        return new Promise((resolve, reject) => {
            const result = [] as Program[];

            FileHelpers.getFilesFromFolderRecursively({
                    breadCrumb: [this.appFolder[1]],
                    fullPath: this.appFolder[0],
                })
                .then((files) => {
                    for (const file of files) {
                        for (const extension of this.appExtensions) {
                            if (file.fullPath.endsWith(extension)) {
                                result.push({
                                    breadCrumb: file.breadCrumb,
                                    executionArgument: file.fullPath,
                                    name: path.basename(file.fullPath).replace(extension, ""),
                                } as Program);
                            }
                        }
                    }
                    resolve(result);
                })
                .catch(() => reject());
        });
    }
}
