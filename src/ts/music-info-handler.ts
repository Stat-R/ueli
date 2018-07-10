export class MusicInfoHandler<T> {
    public onChange: (info: T) => void;
    private cur: T;
    private old: T;

    get value() {
        return this.cur;
    }

    set value(x) {
        this.cur = x;
        if (this.cur !== this.old && this.onChange) {
            this.old = this.cur;
            this.onChange(this.cur);
        }
    }
}
