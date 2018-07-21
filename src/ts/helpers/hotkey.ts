import { StringHelpers } from "./string-helpers";

export class Hotkey {
    private ctrl: boolean = false;
    private shift: boolean = false;
    private alt: boolean = false;
    private meta: boolean = false;
    private letter: string = "";

    constructor(raw: string) {
        const splitted = raw.split("+");
        splitted.forEach((key) => {
            key = key.toLowerCase();
            key = StringHelpers.removeWhiteSpace(key);
            switch (key) {
                case "ctrl":    this.ctrl = true;   break;
                case "shift":   this.shift = true;  break;
                case "alt":     this.alt = true;    break;
                case "meta":    this.meta = true;   break;
                default: this.letter = key;
            }
        });
    }

    public validateWithEvent(event: KeyboardEvent): boolean {
        return (event.ctrlKey === this.ctrl)
            && (event.shiftKey === this.shift)
            && (event.altKey === this.alt)
            && (event.metaKey === this.meta)
            && (event.key.toLowerCase() === this.letter);
    }
}
