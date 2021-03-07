import * as AppUtils from "../../../shared/utils";
import * as Scrapers from "../../typings";
import { App, Undef } from "../../../shared/typings";
import { Generic } from "../generic.builder";
import { Matcher } from "../../../shared";

export class Knowledge extends Generic {
    static get(): typeof Generic {
        return Knowledge;
    }

    static get type(): string {
        return <const> "knowledge";
    }

    get icon(): string {
        return this.$('img.quest_icon').attr('src') as string;
    }

    get group(): Undef<string> {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Category:'],
        });
        const node = this.$('.valign_top')
            .contents()
            .toArray()
            .find(node => matcher.in(node.data));
        if (!node)
            return undefined;
        return node.data
            ?.substr(matcher.indexIn(node.data, true))
            .trim();
    }

    get obtained_from(): Undef<Scrapers.Refs.NPC> {
        const elem = this.$('.iconset_wrapper_medium.inlinediv').first();
        const url  = elem.find('a').attr('href') as string;
        const icon = elem.find('img').attr('src') as string;
        const name = elem.parent().find(`a[href="${url}"]`).last().text();

        return {
            type: 'npc',
            id: AppUtils.decomposeShortURL(url).id,
            icon,
            name,
            shortUrl: url,
            scrape: this.ScrapeFactory(url),
        }
    }

    get description(): Undef<string> {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Description:'],
        });

        const nodes    = this.getTableRow(matcher)?.childNodes || [];
        const startIdx = nodes.findIndex(node => matcher.in(node.data)) + 1;
        
        const strs: string[] = [];
        for (let i = startIdx; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.tagName === 'hr')
                break;
            else if (strs.length && node.tagName === 'br')
                strs.push('\n');
            else if (node.type === 'text' || node.tagName === 'span')
                strs.push(this.$(nodes[i]).text());
        }
        return strs.join('');
    }

    async build(): Promise<Scrapers.Entities.Knowledge> {
        return {
            ...(await super.build()),
            group: this.group,
            category: undefined,
            obtained_from: this.obtained_from,
        }
    }
}