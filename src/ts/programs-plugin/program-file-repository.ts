import * as path from "path";
import { FileHelpers } from "../helpers/file-helpers";
import { Program } from "./program";
import { ProgramRepository } from "./program-repository";

export class ProgramFileRepository implements ProgramRepository {
    private applicationFileExtensions: string[];
    private programs: Program[];

    public constructor(applicationFolders: Array<[string, string]>, applicationFileExtensions: string[]) {
        this.applicationFileExtensions = applicationFileExtensions;
        this.programs = this.loadPrograms(applicationFolders);
    }

    public getPrograms(): Program[] {
        return this.programs;
    }

    private loadPrograms(applicationFolders: Array<[string, string]>): Program[] {
        const result = [] as Program[];

        const files = FileHelpers.getFilesFromFoldersRecursively(
            applicationFolders.map((f) => ({
                breadCrumb: [f[1]],
                fullPath: f[0],
            })),
        );

        for (const file of files) {
            for (const applicationFileExtension of this.applicationFileExtensions) {
                if (file.fullPath.endsWith(applicationFileExtension)) {
                    result.push({
                        breadCrumb: file.breadCrumb,
                        executionArgument: file.fullPath,
                        name: path.basename(file.fullPath).replace(applicationFileExtension, ""),
                    } as Program);
                }
            }
        }

        return result;
    }
}
