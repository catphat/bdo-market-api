import * as Builders from "../index";
import * as AppUtils from "../../../shared/utils";
import * as Scrapers from "../../typings";
import { App, Undef } from "../../../shared/typings";
import { Generic } from "../generic.builder";
import { Matcher } from "../../../shared";

export class NPC extends Generic {
    static get(type: Scrapers.Types, ctg_id: Scrapers.Ctgs): typeof Generic {
        return ({
            [Scrapers.Ctgs.WORKER]: Builders.Worker,
        } as any)[ctg_id]?.get(type, ctg_id) || NPC;
    }

    static get type(): string {
        return <const> "npc";
    }

    private getTitleCells(): CheerioElement[] {
        const ctx = this.cache.for<{
            nodes: CheerioElement[],
        }>('title_cells');
        if (!ctx.has('nodes')) {
            const nodes = this.$('td.titles_cell')
                .first()
                .contents()
                .toArray();
            ctx.set('nodes', nodes);
        }
        return ctx.get('nodes');
    }

    private getNumericPropertyFromTitleCell(matcher: Matcher): number {
        const str = this.getTitleCells()
            .find(node => matcher.in(node.data))
            ?.data
            ?.replace(/\D/g, '') as string;
        return parseInt(str);
    }

    private getKnowledgeDropChance(): number {
        const node = this.getTitleCells()
            .find(node => node.tagName === 'b');
        if (!node)
            return 0;
        return parseFloat(this.$(node).text().replace('%', ''));
    }

    get icon(): string {
        return this.$('img.quest_icon').attr('src') as string;
    }

    get description(): string {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Description:'],
        });
        const row   = this.getTableRow(matcher);
        const nodes = row?.childNodes || [];

        // Usually there are two "descriptions" inside the NPC body.
        // The first one contains the name of the npc, while the second one is
        // the actual description that we are looking for.
        let startIdx = nodes.findIndex(
            node => matcher.in(node.data)
        ) + 1;
        let startIdx_2 = nodes.slice(startIdx).findIndex(
            node => matcher.in(node.data)
        ) + 1;
        if (startIdx_2 !== -1) startIdx += startIdx_2;

        const strs: string[] = [];
        for (let i = startIdx; i < nodes.length; i++) {
            if (nodes[i]?.tagName === 'br' && nodes[i+1]?.tagName === 'br')
                break;
            if (['div', 'hr'].includes(nodes[i]?.tagName))
                break;
            if (nodes[i]?.type === 'text')
                if (['-'].includes(nodes[i]?.data?.trim()[0] as string))
                    break;
            const str = this.$(nodes[i]).text();
            if (!str)
                continue;
            if (strs.length && nodes[i-1]?.tagName !== 'br')
                strs[strs.length - 1] += str;
            else strs.push(str);
        }
        return strs.join('');
    }

    get mob_type(): Scrapers.NPCs.Type {
        const matchers = {
            awakened_boss: new Matcher(this._locale, {
                [App.Locales.US]: ['<Awakened Boss>'],
            }),
            boss: new Matcher(this._locale, {
                [App.Locales.US]: ['<Boss>'],
            }),
        };
        const nodes = this.getTitleCells();
        for (let i = 0; i < nodes.length; i++) {
            if (matchers.awakened_boss.in(nodes[i].data))
                return 'awakened_boss';
            if (matchers.boss.in(nodes[i].data))
                return 'boss';
        }
        return 'normal';
    }

    get lvl(): number {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Level'],
        });
        return this.getNumericPropertyFromTitleCell(matcher) || 1;
    }

    get hp(): number {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['HP'],
        });
        return this.getNumericPropertyFromTitleCell(matcher) || 0;
    }

    get defense(): number {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Defense'],
        });
        return this.getNumericPropertyFromTitleCell(matcher) || 0;
    }

    get evasion(): number {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Evasion'],
        });
        return this.getNumericPropertyFromTitleCell(matcher) || 0;
    }

    get dmg_reduction(): number {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Damage Reduction'],
        });
        return this.getNumericPropertyFromTitleCell(matcher) || 0;
    }

    get exp(): number {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['XP'],
        });
        return this.getNumericPropertyFromTitleCell(matcher) || 0;
    }

    get exp_skill(): number {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Skill XP'],
        });
        return this.getNumericPropertyFromTitleCell(matcher) || 0;
    }

    get karma(): number {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Karma'],
        });
        return this.getNumericPropertyFromTitleCell(matcher) || 0;
    }

    get knowledge(): Undef<Scrapers.NPCs.Knowledge> {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Knowledge:'],
        });
        const row = this.getTableRow(matcher);
        if (!row)
            return undefined;
        const anchors = this.$(row).find('a').toArray();
        
        if (!anchors.length)
            return undefined;
        const url = anchors[0].attribs.href as string;
        return {
            type: 'knowledge',
            id: AppUtils.decomposeShortURL(url).id,
            icon: this.$(anchors[0]).find('img').first().attr('src') as string,
            name: this.$(anchors[1]).text(),
            shortUrl: url,
            drop_chance: this.getKnowledgeDropChance(),
            scrape: this.ScrapeFactory(url),
        }
    }

    async build(): Promise<Scrapers.Entities.NPC> {
        return {
            ...(await super.build()),
            mob_type: this.mob_type,
            category: undefined,
            lvl: this.lvl,
            hp: this.hp,
            defense: this.defense,
            evasion: this.evasion,
            dmg_reduction: this.dmg_reduction,
            exp: this.exp,
            exp_skill: this.exp_skill,
            karma: this.karma,
            knowledge: this.knowledge,
        };
    }
}