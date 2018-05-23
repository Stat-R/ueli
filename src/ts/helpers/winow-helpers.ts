export class WindowHelpers {
    public static calculateWindowHeight(searchResultCount: number,
                                        maxSearchResultCount: number,
                                        userInputHeight: number,
                                        searchResultHeight: number,
                                        musicPlayerHeight: number): number {
        return searchResultCount === 0 ? (userInputHeight + musicPlayerHeight) :
            (searchResultCount >= maxSearchResultCount
                ? WindowHelpers.calculateMaxWindowHeight(userInputHeight, maxSearchResultCount, searchResultHeight)
                : userInputHeight + (searchResultCount * searchResultHeight));
    }

    public static calculateMaxWindowHeight(userInputHeight: number, maxSearchResultCount: number, searchResultHeight: number): number {
        return userInputHeight + (maxSearchResultCount * searchResultHeight);
    }
}
