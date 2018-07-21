export interface SearchResultItem {
    alternativeExecutionArgument?: string;
    alternativePrefix?: string;
    breadCrumb?: string[];
    executionArgument: string;
    icon: string;
    name: string;
    tags?: string[];
}

export interface SearchResultItemViewModel extends SearchResultItem {
    id: string;
    active: boolean;
    description?: string;
}
