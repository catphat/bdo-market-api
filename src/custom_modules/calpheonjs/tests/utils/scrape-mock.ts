import { App } from "../../src/shared/typings";
import { Scrapers } from "../../src"
import { Scraper } from "../../src/scraper/scraper";
import { fetchMock } from "./fetch-mock";
import QueryMock from "./query-mock";

const ScrapeMock: Scrapers.Scrape = async <T = any>(
    id: string,
    type: Scrapers.Types,
    options?: Scrapers.Options,
): Promise<Scrapers.Result<T>> => {
    const locale = options?.locale || App.Locales.US;

    const fetch = (url: string) => fetchMock(url, [
        "scrape",
        locale,
        type,
        id.replace('/', '-'),
    ].join("-"));

    return await new Scraper(
        id,
        locale,
        type,
        fetch,
        QueryMock,
        ScrapeMock,
    ).parse();
}

export default ScrapeMock;
export { Scrapers } from "../../src";