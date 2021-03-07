import cheerio from "cheerio";
import * as Scrapers from "./typings";
import { App } from "../shared/typings";
import { Queries } from "../query";
import { Generic as Builder } from "./builders";

export class Scraper {
    constructor(
        private readonly _id: string,

        private readonly _locale: App.Locales,

        private readonly _type: Scrapers.Types,

        private readonly _fetch: App.FetchFn,

        private readonly _query: Queries.Query,

        private readonly _scrape: Scrapers.Scrape,
    ) {}

    private get url(): string {
        return [
            App.BASE_URL,
            this._locale,
            this._type,
            this._id,
        ].join('/') + '/';
    }

    private getCategoryId($: CheerioStatic): Scrapers.Ctgs {
        const ctg_id = $('.category_text').text()
            .replace(/[^a-zA-Z ]/g, '')
            .toLowerCase()
            .trim()
            .split(' ')
            .join('_');
        return ({
            [App.Locales.US]: {
                'equipment':          Scrapers.Ctgs.EQUIPMENT,
                'crafting_materials': Scrapers.Ctgs.CRAFTING_MATERIAL,
                'consumable':         Scrapers.Ctgs.CONSUMABLE,
                'installable_object': Scrapers.Ctgs.INSTALLABLE_OBJECT,
                'special_items':      Scrapers.Ctgs.SPECIAL_ITEM,
                'recipe':             Scrapers.Ctgs.RECIPE,
                'quest':              Scrapers.Ctgs.QUEST,
                'worker':             Scrapers.Ctgs.WORKER,
                'item_group':         Scrapers.Ctgs.MATERIAL_GROUP,
            }
        }[this._locale] as any)[ctg_id] || Scrapers.Ctgs.UNKNOWN;
    }

    private exists($: CheerioStatic): boolean {
        return $('table.smallertext').length !== 0;
    }

    async fetch(): Promise<string | null> {
        return this._fetch(this.url);
    }

    async parse(): Promise<Scrapers.Result> {
        const res = await this.fetch();
        const $ = cheerio.load(res as string);

        if (!this.exists($)) {
            return { url: this.url, type: null, data: null };
        }

        const ctg_id  = this.getCategoryId($);
        const builder = Builder.get(this._type, ctg_id);

        const data = await new builder(
            this._id,
            this._locale,
            this._type,
            $,
            this._query,
            this._scrape,
        ).build();

        return { url: this.url, type: builder.type, data };
    }
}