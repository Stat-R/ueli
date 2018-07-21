export interface CountRepository {
    getCount(): Count;
    updateCount(count: Count): void;
}

export interface Count {
    [key: string]: number;
}

export class CountManager {
    private countRepository: CountRepository;

    constructor(countRepository: CountRepository) {
        this.countRepository = countRepository;
    }

    public increaseCount(key: string): void {
        let score = this.countRepository.getCount()[key];

        if (isNaN(score)) {
            score = 0;
        }

        score++;

        const count = this.countRepository.getCount();

        count[key] = score;

        this.countRepository.updateCount(count);
    }

    public getCount(): Count {
        return this.countRepository.getCount();
    }
}
