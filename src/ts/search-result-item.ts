export interface BareSearchResultItem {
    name: string;
    tags?: string[];
}

export interface SearchResultItem extends BareSearchResultItem {
    alternativeExecutionArgument?: string;
    alternativePrefix?: string;
    breadCrumb?: string[];
    executionArgument: string;
    hideDescription?: boolean;
    icon: string;
    target?: string;
}

export interface SearchResultItemViewModel extends SearchResultItem {
    id: number;
    active: boolean;
    description?: string;
}
