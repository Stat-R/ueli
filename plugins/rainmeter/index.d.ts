interface BareSearchResultItem {
    name: string;
    tags?: string[];
}

interface SearchResultItem extends BareSearchResultItem {
    alternativeExecutionArgument?: string;
    alternativePrefix?: string;
    breadCrumb?: string[];
    executionArgument: string;
    icon: string;
}

interface SearchResultItemViewModel extends SearchResultItem {
    id: string;
    active: boolean;
    description?: string;
}

interface Bang {
    bang: string,
    para: string[]
}