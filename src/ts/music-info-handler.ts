export type InfoSender = (channel: string, value: string | number | boolean) => void;

export class MusicInfoHandler {
    public cur: string | number | boolean;
    public old: string | number | boolean;
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
