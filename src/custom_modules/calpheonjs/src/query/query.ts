import * as Queries from "./typings";
import * as Builders from "./builders";
import { App } from "../shared/typings";
import { Scrapers } from "../scraper";

export class Query {
    constructor(
        protected readonly _id: string,

        protected readonly _group: Queries.Groups,

        protected readonly _itemAs: Queries.ItemAs,

        protected readonly _locale = App.Locales.US,

        protected readonly fetch: App.FetchFn,

        protected readonly _scrape: Scrapers.Scrape,
    ) {}

    get url(): string {
        const idKey = [
            Queries.ItemAs.NPC_DROP,
            Queries.ItemAs.NODE_DROP,
            Queries.ItemAs.CONTAINER,
            Queries.ItemAs.QUEST_REWARD,
        ].includes(this._itemAs) ? 'id' : 'item_id';
        return App.BASE_URL + '/query.php?' + Object.entries({
            a: this._group,
            type: this._itemAs,
            [idKey]: this._id,
            l: this._locale,
        })
        .map(entry => entry.join('='))
        .join('&');
    }

    async parse(): Promise<Queries.Result> {
        const res = await this.fetch(this.url);
        if (!res) {
            return { url: this.url, type: null, data: [] };
        }
        const obj = JSON.parse(res.trim());
        const builder = this.getBuilder();
        return {
            url: this.url,
            type: builder.type as Queries.EntityTypes,
            data: new builder(this._locale, this._scrape).build(obj),
        };
    }

    private getBuilder(): typeof Builders.Generic {
        const { Groups, ItemAs } = Queries;
        const { _group: g, _itemAs: a } = this;
        if ([Groups.PROCESSING, Groups.RECIPE, Groups.DESIGN].includes(g))
            return Builders.Recipe;
        if ([ItemAs.NPC_DROP].includes(a))
            return Builders.NPCDrop;
        if ([ItemAs.NODE_DROP].includes(a))
            return Builders.Node;
        if ([ItemAs.CONTAINER].includes(a))
            return Builders.Item;
        if ([Groups.NPC].includes(g))
            return Builders.NPC;
        if ([Groups.QUEST].includes(g))
            return Builders.Quest;
        return Builders.Generic;
    }
}