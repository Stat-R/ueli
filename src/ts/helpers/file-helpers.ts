import * as fs from "fs";
import * as path from "path";

export interface FancyFile {
    fullPath: string;
    breadCrumb: string[];
}

export class FileHelpers {
    public static getFilesFromFolderRecursively(folderPath: FancyFile): FancyFile[] {
        try {
            let result = [] as FancyFile[];
            const fileNames = FileHelpers.getFileNamesFromFolder(folderPath.fullPath);

            for (const fileName of fileNames) {
                try {
                    const filePath = path.join(folderPath.fullPath, fileName);
                    const stats = fs.lstatSync(filePath);

                    const fancified = {
                        breadCrumb: [...folderPath.breadCrumb, fileName],
                        fullPath: filePath,
                    } as FancyFile;

                    if (stats.isDirectory()) {
                        // treat .app folder as a file
                        // because going recursively through the app folder on macOS would cause longer scan times
                        if (filePath.endsWith(".app")) {
                            result.push(fancified);
                        } else {
                            result = result.concat(FileHelpers.getFilesFromFolderRecursively(fancified));
                        }
                    } else if (stats.isFile()) {
                        result.push(fancified);
                    }
                } catch (error) {
                    continue;
                }
            }

            return result;

        } catch (error) {
            return [];
        }
    }

    public static getFilesFromFolder(folderPath: FancyFile): FancyFile[] {
        try {
            const fileNames = FileHelpers.getFileNamesFromFolder(folderPath.fullPath);

            const filePaths = fileNames.map((f): FancyFile => {
                return {
                    breadCrumb: [...folderPath.breadCrumb, f],
                    fullPath: path.join(folderPath.fullPath, f),
                };
            });

            const accessibleFiles = filePaths.map((filePath) => {
                try {
                    fs.lstatSync(filePath.fullPath);
                    return filePath;
                } catch (err) {
                    // do nothing
                }
            }).filter((maybe) => maybe !== undefined) as FancyFile[];

            return accessibleFiles;
        } catch (error) {
            return [];
        }
    }

    public static getFilesFromFoldersRecursively(folderPaths: FancyFile[]): FancyFile[] {
        const result = folderPaths.map((folderPath) => {
            return FileHelpers.getFilesFromFolderRecursively(folderPath);
        }).reduce((acc, files) => acc.concat(files));

        return result;
    }

    private static getFileNamesFromFolder(folderPath: string): string[] {
        const allFiles = fs.readdirSync(folderPath);

        const visibleFiles = allFiles.filter((fileName) => {
            return !fileName.startsWith(".");
        });

        return visibleFiles;
    }
}
