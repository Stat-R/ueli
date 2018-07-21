export interface CountRepository {
    getCount(): Count;
    updateCount(count: Count): void;
}

export interface Count {
    [key: string]: number;
}
