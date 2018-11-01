export class FilePathRegex {
    public static readonly windowsFilePathRegExp = /^[a-zA-Z]:\\[^|<>"]*$/;
    public static readonly macOsFilePathRegexp = /^\/$|(^(?=\/)|^\.|^\.\.)(\/(?=[^/\0])[^/\0]+)*\/?$/;
}
