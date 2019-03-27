export class FileHelpers {
    public static toHTML(fullPath: string, baseName: string) {
        return `<a class="breadcrumb-link" onclick="event.stopPropagation();handleLinkClick('${fullPath.replace(/\\/g, "\\\\")}')">${baseName}</a>`;
    }

    public static filePathToBreadCrumbs(filePath: string): string[] {
        const crumbs = filePath.split("\\");
        if (!crumbs[crumbs.length - 1]) {
            crumbs.length = crumbs.length - 1;
        }

        return this.crumbsToLinkedCrumbs(crumbs);
    }

    public static crumbsToLinkedCrumbs(crumbs: string[]): string[] {
        const linkedCrumbs = new Array<string>(crumbs.length);
        for (let i = 0; i < crumbs.length; i++) {
            const fullPath = crumbs.slice(0, i + 1).join("\\");
            linkedCrumbs[i] = this.toHTML(fullPath, crumbs[i]);
        }

        return linkedCrumbs;
    }

    public static filePathToFancyBreadCrumbs(filePath: string, rootPath: string, fancyName: string): string[] {
        if (!rootPath.endsWith("\\")) {
            rootPath += "\\";
        }
        const crumbs = filePath.replace(rootPath, "").split("\\");
        if (!crumbs[crumbs.length - 1]) {
            crumbs.length = crumbs.length - 1;
        }

        return this.fancyCrumbsToLinkedCrumbs(rootPath, fancyName, crumbs);
    }

    public static fancyCrumbsToLinkedCrumbs(rootPath: string, fancyName: string, crumbs: string[]): string[] {
        const linkedCrumbs = new Array<string>(crumbs.length);
        for (let i = 0; i < crumbs.length; i++) {
            const fullPath = rootPath + crumbs.slice(0, i + 1).join("\\");
            linkedCrumbs[i] = this.toHTML(fullPath, crumbs[i]);
        }

        linkedCrumbs.unshift(this.toHTML(rootPath, fancyName));
        return linkedCrumbs
    }
}
