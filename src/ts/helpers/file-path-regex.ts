export class FilePathRegex {
    public static readonly windowsFilePathRegExp = /^[a-z]:\\[^|<>"]*$/i;
    public static readonly macOsFilePathRegexp = /^\/$|(^(?=\/)|^\.|^\.\.)(\/(?=[^/\0])[^/\0]+)*\/?$/i;
}
