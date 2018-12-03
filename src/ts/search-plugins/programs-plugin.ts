import { Icons } from "../icon-manager/icon-manager";
import { SearchResultItem } from "../search-result-item";
import { SearchPlugin } from "./search-plugin";
import { ConfigOptions } from "../config-options";
import { FileHelpers } from "../helpers/file-helpers";
import { StringHelpers } from "../helpers/string-helpers";
import * as path from "path";
import { shell, NativeImage, app, ShortcutDetails } from "electron";

interface Program {
    name: string;
    isLnk: boolean;
}

export class ProgramsPlugin implements SearchPlugin {
    private folders: Array<[string, string]>;
    private extensions: string[];
    private blacklist: string[];
    private shouldFetchIcon: boolean;

    public constructor(config: ConfigOptions) {
        this.folders = config.applicationFolders;
        this.extensions = config.applicationFileExtensions.map((item) => item.toLowerCase());
        this.blacklist = config.applicationKeywordBlacklist.map((item) => item.toLowerCase());
        this.shouldFetchIcon = config.useNativeApplicationIcon;
    }

    public async getAllItems(): Promise<SearchResultItem[]> {
        const results = [] as SearchResultItem[];

        for (const applicationFolder of this.folders) {
            const breadCrumb = [FileHelpers.toHTML(applicationFolder[0], applicationFolder[1])];
            const fullPath = applicationFolder[0];

            const files = await FileHelpers.getFilesFromFolderRecursively({ breadCrumb, fullPath });
            for (const file of files) {
                const detail = this.getNameExtension(file.fullPath);

                if (!detail) {
                    continue;
                }

                let tags: string[] | undefined;
                let icon: string | undefined;

                if (detail.isLnk) {
                    const info = this.getShortcutInfo(file.fullPath);

                    if (info) {
                        tags = this.pathToTags(info.target);

                        if (this.shouldFetchIcon) {
                            if (info.icon && !info.icon.endsWith(".dll")) {
                                icon = await this.pathToIcon(info.icon);
                            }

                            if (!icon && info.target) {
                                icon = await this.pathToIcon(info.target);
                            }
                        }
                    }
                }

                results.push({
                    alternativePrefix: "Run as Admin",
                    breadCrumb: file.breadCrumb,
                    executionArgument: file.fullPath,
                    icon: icon || Icons.PROGRAM,
                    name: detail.name,
                    tags,
                } as SearchResultItem);
            }
        }

        return results;
    }

    private getNameExtension(filePath: string): Program | undefined {
        const fileExt = path.extname(filePath);
        const name = path.basename(filePath, fileExt);

        if (this.shouldIgnore(name)) {
            return;
        }

        const fileExtLower = fileExt.toLowerCase();

        if (this.extensions.includes(fileExtLower)) {
            const isLnk = fileExtLower === ".lnk";

            return {name, isLnk};
        }

        return;
    }

    private shouldIgnore(name: string): boolean {
        const words = StringHelpers.stringToWords(name.toLowerCase());

        for (const keyword of this.blacklist) {
            if (words.includes(keyword)) {
                return true;
            }
        }
        return false;
    }

    private getShortcutInfo(filePath: string): ShortcutDetails | undefined {
        try {
            return shell.readShortcutLink(filePath);
        } catch {
            return;
        }
    }

    private pathToTags(filePath: string): string[] | undefined {
        if (!filePath) {
            return;
        }

        const target = path.basename(filePath, path.extname(filePath));

        if (target === "powershell" || target === "cmd") {
            return;
        }

        return [target];
    }

    private pathToIcon(iconTarget: string | undefined): Promise<string | undefined> {
        return new Promise<string | undefined>((resolve) => {
            if (!iconTarget) {
                resolve();
                return;
            }

            iconTarget = iconTarget.replace(/%([^%]+)%/g, (original: string, varName: string): string => {
                const varValue = process.env[varName];

                if (varValue) {
                    return varValue;
                }

                return original;
            });

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
