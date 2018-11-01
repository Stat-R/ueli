interface BareSearchResultItem {
    name: string;
    tags?: string[];
}

interface SearchResultItem extends BareSearchResultItem {
    alternativeExecutionArgument?: string;
    alternativePrefix?: string;
    breadCrumb?: string[];
    executionArgument: string;
    hideDescription?: boolean;
    icon: string;
}

interface APIResponse {
    success: boolean;
    timestamp: number;
    base: string;
    date: string;
    rates: {
        [key: string]: number;
    }
}

interface ConvertData {
    from: string;
    to: string[];
    value: number;
}