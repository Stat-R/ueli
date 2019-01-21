import { SearchPlugin } from "./search-plugin";
import { Icons } from "../icon-manager/icon-manager";
import { SearchResultItem } from "../search-result-item";
import * as fs from "fs";
import * as path from "path";
import * as SQL from "sql.js";

interface ChromiumURLItem {
    name: string;
    type: "url";
    url: string;
}

interface ChromiumFolderItem {
    children: Array<ChromiumURLItem | ChromiumFolderItem>;
    name: string;
    type: "folder";
}

interface ChromiumRoot {
    [key: string]: ChromiumFolderItem | ChromiumRoot;
}

interface Chromium {
    roots: ChromiumRoot;
}

export class BrowserBookmark implements SearchPlugin {
    public readonly needSort = true;
    private items: SearchResultItem[];

    constructor(browser: string, bookmarkFilePath: string) {
        this.items = [];
        browser = browser.toLowerCase();
        // Firefox
        if (browser === "firefox" && process.env.APPDATA) {
            let databasePath = path.join(process.env.APPDATA, "Mozilla/Firefox/Profiles/");

            if (!bookmarkFilePath) {
                const profileFolders = fs.readdirSync(databasePath);
                if (!profileFolders[0]) {
                    return;
                }
                bookmarkFilePath = profileFolders[0];
            }

            databasePath = path.join(databasePath, bookmarkFilePath, "places.sqlite");

            this.items = [];
            let fileBuffer: Buffer;
            try {
                fileBuffer = fs.readFileSync(databasePath);
            } catch (_error) {
                return;
            }
            const db = new SQL.Database(fileBuffer);

            const results = db.exec(`SELECT b.title, p.url FROM moz_bookmarks b JOIN moz_places p ON b.fk = p.id WHERE p.url NOT LIKE 'place%'`);
            db.close();

            if (!results[0]
                && !results[0].values
                && results.values.length === 0) {
                return;
            }

            // [title, url]
            results[0].values.forEach((row: [string, string]) => {
                if (row[1]) {
                    this.items.push({
                        executionArgument: row[1],
                        icon: Icons.BOOKMARK,
                        name: row[0] || row[1],
                        tags: [new URL(row[1]).hostname],
                    } as SearchResultItem);
                }
            });
        } else if (browser === "chrome" && process.env.LOCALAPPDATA) {
            let databasePath: string;
            if (bookmarkFilePath) {
                databasePath = bookmarkFilePath;
            } else {
                databasePath = path.join(process.env.LOCALAPPDATA, "Google/Chrome/User Data/Default/Bookmarks");
            }
            this.getChromiumURLItems(databasePath);
        } else if (browser === "vivaldi" && process.env.LOCALAPPDATA) {
            let databasePath: string;
            if (bookmarkFilePath) {
                databasePath = bookmarkFilePath;
            } else {
                databasePath = path.join(process.env.LOCALAPPDATA, "Vivaldi/User Data/Default/Bookmarks");
            }
            this.getChromiumURLItems(databasePath);
        } else if (browser === "opera" && process.env.APPDATA) {
            let databasePath: string;
            if (bookmarkFilePath) {
                databasePath = bookmarkFilePath;
            } else {
                databasePath = path.join(process.env.APPDATA, "Opera Software/Opera Stable/Bookmarks");
            }
            this.getChromiumURLItems(databasePath);
        } else if (browser === "chromium" && bookmarkFilePath) {
            this.getChromiumURLItems(bookmarkFilePath);
        }
    }

    public async getAllItems(): Promise<SearchResultItem[]> {
        return this.items;
    }

    private getURLOnly(mess: Array<ChromiumFolderItem | ChromiumURLItem>): ChromiumURLItem[] {
        const results: ChromiumURLItem[] = [];
        mess.forEach((item) => {
            if (item.type === "folder") {
                results.push(...this.getURLOnly(item.children));
            } else {
                results.push(item);
            }
        });
        return results;
    }

    private getChromiumURLItems(databasePath: string): any {
        const collection: ChromiumURLItem[] = [];
        let raw: string;
        try {
            raw = fs.readFileSync(databasePath, "utf-8");
        } catch (_error) {
            return collection;
        }
        const db: Chromium = JSON.parse(raw);
        const dbRoot = db.roots;

        collection.push(...this.expandRoot(dbRoot));

        this.items = collection.map((item) => ({
            executionArgument: item.url,
            icon: Icons.URL,
            name: item.name,
            tags: [new URL(item.url).hostname],
        }) as SearchResultItem);
    }

    private expandRoot(root: ChromiumRoot): ChromiumURLItem[] {
        const collection: ChromiumURLItem[] = [];
        Object.keys(root).forEach((key: string) => {
            if ((root[key] as ChromiumFolderItem).children) {
                collection.push(...this.getURLOnly((root[key] as ChromiumFolderItem).children));
            } else if (typeof root[key] === "object") {
                collection.push(...this.expandRoot((root[key] as ChromiumRoot)));
            }
        });
        return collection;
    }
}
