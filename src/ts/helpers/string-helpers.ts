export class StringHelpers {
    public static removeWhiteSpace(value: string): string {
        return value.replace(/\s/g, "");
    }

    public static stringIsWhiteSpace(value?: string): boolean {
        if (value === undefined) {
            return true;
        }

        return StringHelpers.removeWhiteSpace(value).length === 0;
    }

    public static trimAndReplaceMultipleWhiteSpacesWithOne(value: string): string {
        return value.replace(/\s\s+/g, " ").trimLeft();
    }

    public static stringToWords(value: string, filterEmptyString = true): string[] {
        const words = value.split(/\s/g);
        if (filterEmptyString) {
            return words.filter((w) => {
                return !StringHelpers.stringIsWhiteSpace(w);
            });
        }

        return words;
    }

    public static insertString(base: string, index: number, value: string) {
        return `${base.substr(0, index)}${value}${base.substr(index)}`;
    }
}
