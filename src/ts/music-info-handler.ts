export type InfoSender = (channel: string, value: any) => void;

export class MusicInfoHandler<T> {
    private cur: T;
    private old: T;
    private sender: InfoSender;
    private channel: string;

    constructor(sender: InfoSender, ipcChannel: string) {
        this.sender = sender;
        this.channel = ipcChannel;
    }

    get value() {
        return this.cur;
    }

    set value(x) {
        this.cur = x;
        if (this.cur !== this.old) {
            this.old = this.cur;
            this.sender(this.channel, this.cur);
        }
    }
}
