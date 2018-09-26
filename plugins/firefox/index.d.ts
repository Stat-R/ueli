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