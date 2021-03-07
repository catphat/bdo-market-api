import * as Builders from "./index";
import * as AppUtils from "../../shared/utils";
import * as Scrapers from "../typings";
import { App, BDOCodex, Undef } from "../../shared/typings";
import { Queries } from "../../query";
import { Matcher, ContextCache } from "../../shared";

export class Generic {
    static get(type: Scrapers.Types, ctg_id: Scrapers.Ctgs): typeof Generic {
        const { Types } = Scrapers;
        return {
            [Types.ITEM]:           Builders.Item,
            [Types.KNOWLEDGE]:      Builders.Knowledge,
            [Types.MATERIAL_GROUP]: Builders.MaterialGroup,
            [Types.NPC]:            Builders.NPC,
            [Types.QUEST]:          Builders.Quest,
            [Types.RECIPE]:         Builders.Recipe,
        }[type]?.get(type, ctg_id) || Generic;
    }

    static get type(): string {
        return <const> "unknown";
    }

    constructor(
        protected readonly _id: string,

        protected readonly _locale: App.Locales,

        protected readonly _type: Scrapers.Types,

        protected readonly $: CheerioStatic,

        protected readonly _query: Queries.Query,

        protected readonly _scrape: Scrapers.Scrape,
    ) {}

    protected readonly cache = new ContextCache();

    protected getTableRows(): CheerioElement[] {
        const ctx = this.cache.for<{
            rows?: CheerioElement[],
        }>('table_rows')
        if (!ctx.has('rows')) {
            const rows = this.$('.smallertext > tbody > tr > td').toArray();
            ctx.set('rows', rows);
        }
        return ctx.get('rows');
    }

    protected getTableRow(matcher: Matcher): Undef<CheerioElement> {
        return this.getTableRows()
            .find(node => matcher.in(this.$(node).text()));
    }

    protected getBodyNodes(deep?: boolean): CheerioElement[] {
        const ctx = this.cache.for<{
            flat?: CheerioElement[],
            deep?: CheerioElement[],
        }>('body_nodes');
        if (!ctx.has('flat')) {
            const nodes = this.$('table.smallertext > tbody > tr > td')
                .contents()
                .toArray();
            ctx.set('flat', nodes);
        }
        if (deep && !ctx.has('deep')) {
            let nodes = ctx.get<CheerioElement[]>('flat');
            let i = -1;
            while (++i < nodes.length)
                if (nodes[i].children)
                    nodes.splice(i+1, 0, ...nodes[i].children);
            ctx.set('deep', nodes);
        }
        return deep ? ctx.get('deep') : ctx.get('flat');
    }

    protected getTextNodeFromCategoryWrapper(matcher: Matcher) {
        const ctx = this.cache.for<{
            nodes?: CheerioElement[],
        }>('category_nodes');
        if (!ctx.has('nodes')) {
            const nodes = this.$('.category_text')
                .parent()
                .contents()
                .toArray();
            ctx.set('nodes', nodes);
        }
        return ctx.get<CheerioElement[]>('nodes')
            .find(node => matcher.in(this.$(node).text()));
    }

    protected parsePageInfo(): BDOCodex.PageInfo {
        const ctx = this.cache.for<{
            data?: BDOCodex.PageInfo
        }>('page_info');
        if (!ctx.has('data')) {
            const raw = this.$('script[type="application/ld+json"]')
                .first()
                .html();
            const data = raw ? JSON.parse(raw.trim()) : {};
            ctx.set('data', data);
        }
        return ctx.get('data');
    }

    protected ScrapeFactory(shortUrl: string): Scrapers.ScrapeFn {
        const { type, id } =  AppUtils.decomposeShortURL(shortUrl);
        return async () => this._scrape(id, type as Scrapers.Types, {
            locale: this._locale
        });
    }

    protected QueryFactory(type: Queries.Types): Undef<Queries.QueryFn> {
        const QTypes = Queries.Types;
        const ids = {
            [App.Locales.US]: {
                [QTypes.PRODUCT_IN_PROCESSING]:  'mproductofrecipe',
                [QTypes.PRODUCT_IN_RECIPE]:      'productofrecipe',
                [QTypes.PRODUCT_IN_DESIGN]:      'productofdesign',
                [QTypes.MATERIAL_IN_PROCESSING]: 'mrecipematerial',
                [QTypes.MATERIAL_IN_RECIPE]:     'recipematerial',
                [QTypes.MATERIAL_IN_DESIGN]:     'designmaterial',
                [QTypes.NPC_DROPS]:              'droppedbynpc',
                [QTypes.DROPPED_IN_NODE]:        'nodedrop',
                [QTypes.OBTAINED_FROM]:          'itempacksource',
                [QTypes.SOLD_BY_NPC]:            'specialsoldbynpc',
                [QTypes.QUEST_REWARD]:           'questreward',
            }
        }[this._locale];
        if (!this.$(`a[href="#tabs-${(ids as any)[type]}"]`).length)
            return undefined;
        return () => this._query(this._id, type, { locale: this._locale });
    }

    get icon(): string {
        return this.$('.item_icon').attr('src') as string;
    }

    get name(): string {
        return AppUtils.cleanStr(this.$('.item_title').text());
    }

    get name_alt(): Undef<string> {
        return this.$('.item_sub_title').text() || undefined;
    }

    get category(): string {
        return AppUtils.cleanStr(this.$('.category_text').text());
    }

    get grade(): number {
        return parseInt(this.$('.item_title')
            .attr('class')
            ?.replace(/\D/g, '') as string) || 0;
    }

    get description(): Undef<string> {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Description:'],
        });
        const nodes = this.getTableRow(matcher)?.childNodes || [];
        
        let i = nodes.findIndex(node => matcher.in(node.data));
        if (i === -1) return undefined;

        const strs: string[] = [];
        while (++i < nodes.length) {
            if (nodes[i]?.tagName === 'br' && nodes[i+1]?.tagName === 'br')
                break;
            if (['div', 'hr'].includes(nodes[i]?.tagName))
                break;
            if (nodes[i]?.type === 'text')
                if (['-'].includes(nodes[i].data?.trim()[0] as string))
                    break;
            const str = this.$(nodes[i]).text();
            if (!str)
                continue;
            if (strs.length && nodes[i-1]?.tagName !== 'br')
                strs[strs.length - 1] += str;
            else strs.push(str);
        }
        return strs.join('\n').trim();
    }

    async build(): Promise<Scrapers.Entities.Generic> {
        return {
            id: this._id,
            icon: this.icon,
            name: this.name,
            name_alt: this.name_alt,
            type: this._type,
            category: this.category,
            description: this.description,
        };
    }
}