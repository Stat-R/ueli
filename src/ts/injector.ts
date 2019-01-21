import { join } from "path";

export class Injector {
    public static readonly webUrlRegExp = /^((https?:)?[/]{2})?([a-z0-9]+[.])+[a-z]+.*$/i;

    public static getTrayIconPath(pathToProjectRoot: string): string {
        return join(pathToProjectRoot, "img/icons/win/icon.ico");
    }
}
