import { DirectorySeparator } from "../directory-separator";
import * as fs from "fs";
import * as path from "path";

export interface FancyFile {
    fullPath: string;
    breadCrumb: string[];
}

export class FileHelpers {
    public static getFilesFromFolderRecursively(folderPath: FancyFile): Promise<FancyFile[]> {
        return new Promise((resolve, _reject) => {
            let result = [] as FancyFile[];

            FileHelpers.getFileNamesFromFolder(folderPath.fullPath)
                .then((fileNames) => {
                    let pending = fileNames.length;
                    if (!pending) {
                        resolve(result);
                    }

                    fileNames.forEach((fileName) => {
                        const filePath = path.resolve(folderPath.fullPath, fileName);
                        const link = this.toHTML(filePath, fileName);
                        fs.stat(filePath, (error, stat) => {
                            if (error ) {
                                if (!--pending) {
                                    resolve(result);
                                }
                                return;
                            }

                            const fancified = {
                                breadCrumb: [...folderPath.breadCrumb, link],
                                fullPath: filePath,
                            } as FancyFile;

                            if (stat && stat.isDirectory() && !filePath.endsWith(".app")) {
                                FileHelpers.getFilesFromFolderRecursively(fancified)
                                    .then((res) => {
                                        result = result.concat(res);
                                        if (!--pending) {
                                            resolve(result);
                                        }
                                    })
                                    .catch(() => {
                                        if (!--pending) {
                                            resolve(result);
                                        }
                                    });
                            } else {
                                result.push(fancified);
                                if (!--pending) {
                                    resolve(result);
                                }
                            }
                        });
                    });
                })
                .catch(() => {
                    resolve(result);
                });
        });
    }

    public static getFilesFromFolder(folderPath: FancyFile): Promise<FancyFile[]> {
        return new Promise((resolve, reject) => {
            const result = [] as FancyFile[];
            FileHelpers.getFileNamesFromFolder(folderPath.fullPath)
                .then((filePaths) => {
                    const fancifiedPaths = filePaths.map((fileName): FancyFile => {
                        const filePath = path.join(folderPath.fullPath, fileName);
                        const link = this.toHTML(filePath, fileName);
                        return {
                            breadCrumb: [...folderPath.breadCrumb, link],
                            fullPath: filePath,
                        }
                    });
                    let pending = fancifiedPaths.length;

                    if (!pending) {
                        resolve(result);
                    }

                    fancifiedPaths.forEach((f: FancyFile) => {
                        // Check file accessibilty
                        fs.lstat(f.fullPath, (error) => {
                            if (!error) {
                                result.push(f);
                            }

                            if (!--pending) {
                                resolve(result);
                            }
                        });

                    });
                })
                .catch(() => reject());
        });
    }

    public static getFilesFromFoldersRecursively(folderPaths: FancyFile[]): Array<Promise<FancyFile[]>> {
        const result = folderPaths.map((folderPath) => {
            return FileHelpers.getFilesFromFolderRecursively(folderPath);
        });

        return result;
    }

    public static toHTML(fullPath: string, baseName: string) {
        return `<a class="breadcrumb-link" onclick="event.stopPropagation();handleLinkClick('${fullPath.replace(/\\/g, "\\\\")}')">${baseName}</a>`
    }

    public static filePathToBreadCrumbs(filePath: string): string[] {
        let crumbs = filePath.split(DirectorySeparator.WindowsDirectorySeparator);
        if (!crumbs[crumbs.length - 1]) {
            crumbs.length = crumbs.length - 1;
        }

        const linkedCrumbs = new Array<string>(crumbs.length);
        for (let i = 0; i < crumbs.length; i++) {
            const filePath = crumbs.slice(0, i + 1).join(DirectorySeparator.WindowsDirectorySeparator);
            linkedCrumbs[i] = this.toHTML(filePath, crumbs[i]);
        }

        return linkedCrumbs;
    }

    private static getFileNamesFromFolder(folderPath: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(folderPath, (error, files) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (files && files.length > 0) {
                    files = files.filter((fileName) => !fileName.startsWith("."));
                    if (files.length === 0) {
                        reject();
                        return;
                    }
                    resolve(files);
                } else {
                    reject();
                }
            });
        });
    }
}
