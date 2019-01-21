import { Icons } from "../icon-manager/icon-manager";
import { SearchResultItem } from "../search-result-item";
import { SearchPlugin } from "./search-plugin";
import { ConfigOptions } from "../config-options";
// import { FileHelpers } from "../helpers/file-helpers";
import { StringHelpers } from "../helpers/string-helpers";
import * as path from "path";
import { shell, NativeImage, app, ShortcutDetails } from "electron";
import { NativeUtil } from "../native-lib";

interface Program {
    name: string;
    isLnk: boolean;
}

export class ProgramsPlugin implements SearchPlugin {
    private folders: Array<[string, string]>;
    private extensions: string[];
    private blacklist: string[];
    private shouldFetchIcon: boolean;
    private nativeUtil: NativeUtil;

    public constructor(config: ConfigOptions, nativeUtil: NativeUtil) {
        this.folders = config.applicationFolders;
        this.extensions = config.applicationFileExtensions.map((item) => item.toLowerCase());
        this.blacklist = config.applicationKeywordBlacklist.map((item) => item.toLowerCase());
        this.shouldFetchIcon = config.useNativeApplicationIcon;
        this.nativeUtil = nativeUtil;
    }

    public async getAllItems(): Promise<SearchResultItem[]> {
        const results = [] as SearchResultItem[];

        for (const applicationFolder of this.folders) {
            // const breadCrumb = [FileHelpers.toHTML(applicationFolder[0], applicationFolder[1])];
            const fullPath = applicationFolder[0];

            const files = this.nativeUtil.recursiveIterateFolder(fullPath);

            for (const file of files) {
                if (file.isDir()) {
                    continue;
                }

                const filePath = file.path();
                const detail = this.getNameExtension(file.name());

                if (!detail) {
                    continue;
                }

                let tags: string[] | undefined;
                let icon: string | undefined;
                let target: string | undefined;

                if (detail.isLnk) {
                    const info = this.getShortcutInfo(filePath);

                    if (info) {
                        target = this.replaceEnvVar(info.target);

                        tags = this.pathToTags(target);

                        if (this.shouldFetchIcon) {
                            if (info.icon && !info.icon.endsWith(".dll")) {
                                info.icon = this.replaceEnvVar(info.icon);
                                icon = await this.pathToIcon(info.icon);
                            }

                            if (!icon && target) {
                                icon = await this.pathToIcon(target);
                            }
                        }
                    }
                }

                results.push({
                    alternativePrefix: "Run as Admin",
                    executionArgument: filePath,
                    hideDescription: true,
                    icon: icon || Icons.PROGRAM,
                    name: detail.name,
                    tags,
                    target,
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

            app.getFileIcon(iconTarget, (error: Error, image: NativeImage) => {
                if (error) {
                    resolve();
                    return;
                }

                resolve(`<image href='${image.toDataURL()}'/>`);
            });
        });
    }

    private replaceEnvVar(input: string): string {
        return input.replace(
            /%([^%]+)%/g,
            (original: string, varName: string): string => {
                const varValue = process.env[varName];

                if (varValue) {
                    return varValue;
                }

                return original;
            },
        );
    }
}
