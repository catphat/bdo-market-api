import cheerio from "cheerio";
import * as AppUtils from "../../../shared/utils";
import * as Scrapers from "../../typings";
import { BDOCodex, App, Undef } from "../../../shared/typings";
import { Item } from "./item.builder";
import { Matcher } from "../../../shared";

export class Equipment extends Item {
    static get(): typeof Item {
        return Equipment;
    }

    static get type(): string {
        return <const> "equipment";
    }

    private parseEnchantmentArray(): BDOCodex.Enchantment.Array {
        const ctx = this.cache.for<{
            data: BDOCodex.Enchantment.Array,
        }>('enchantment_array');
        if (!ctx.has('data')) {
            ctx.set('data', JSON.parse(this.$('#enchantment_array').text()));
        }
        return ctx.get('data');
    }

    private parseCaphrasData(): BDOCodex.Caphras.Data {
        const ctx = this.cache.for<{
            data: BDOCodex.Caphras.Data,
        }>('caphras_data');
        if (!ctx.has('data')) {
            const node = this.$('.item_title')
                .first()
                .parent()
                .find('script')
                .first();
            if (!node.is('script'))
                return ctx.set('data', {}) as any;
            const raw = node.html() || '';
            const str = raw.substring(raw.indexOf('=') + 1);
            ctx.set('data', JSON.parse(AppUtils.cleanStr(str, ';\t')));
        }
        return ctx.get('data');
    }

    private parseEffects(raw: string, matcher: Matcher): string[] {
        const $ = cheerio.load('<div>' + raw + '</div>');
        const strs = $('div').html()?.split('<br>') || [];

        let i = strs.findIndex(str => matcher.in(str));
        if (!matcher.length)
            return [];
        
        const effects: string[] = [];
        while (i++ < strs.length) {
            if (strs[i] === '')
                break;
            const effect = AppUtils.cleanStr($(strs[i]).text());
            if (effect) effects.push(effect);
        }
        return effects;
    }

    private parseStat(value?: string | number): Undef<Scrapers.Stat> {
        if (value === undefined || value === '')
            return undefined;
        const nums = value.toString().split(' ~ ')
            .map(str => parseInt(str))
            .filter(num => num || num === 0);
        if (nums.length === 1 || nums[0] === nums[1])
            return nums[0];
        return nums as [number, number];
    }

    private extractStats(obj: BDOCodex.StatsObj): Scrapers.Equipments.Stats {
        const { Stats } = Scrapers;
        const toStat = this.parseStat.bind(this);
        return AppUtils.filterObj({
            [Stats.HP]:              toStat(obj.hp),
            [Stats.MP]:              toStat(obj.mp),
            [Stats.DAMAGE]:          toStat(obj.damage),
            [Stats.DEFENSE]:         toStat(obj.defense),
            [Stats.ACCURACY]:        toStat(obj.accuracy),
            [Stats.EVASION]:         toStat(obj.evasion),
            [Stats.DMG_REDUCTION]:   toStat(obj.dreduction),
            [Stats.H_DAMAGE]:        toStat(obj.hdamage),
            [Stats.H_DEFENSE]:       toStat(obj.hdefense),
            [Stats.H_ACCURACY]:      toStat(obj.haccuracy),
            [Stats.H_EVASION]:       toStat(obj.hevasion),
            [Stats.H_DMG_REDUCTION]: toStat(obj.hdreduction),
        });
    }

    get stats(): Scrapers.Equipments.Stats {
        return this.enhancement_stats[0].stats;
    }

    get enhancement_stats(): Scrapers.Equipments.Enhancement[] {
        const data = this.parseEnchantmentArray();
        const maxLvl = parseInt(data.max_enchant) || 0;

        return Array(maxLvl + 1).fill(0).map((_, lvl) => {
            const curr = data[lvl];

            const { edescription: raw } = curr;
            const effects = {
                enhancement: this.parseEffects(raw, new Matcher(this._locale, {
                    [App.Locales.US]: ['Enhancement Effect'],
                })),
                item: this.parseEffects(raw, new Matcher(this._locale, {
                    [App.Locales.US]: ['Item Effect'],
                })),
            }

            const url = AppUtils.composeShortURL(
                curr.need_enchant_item_id,
                'item',
                this._locale,
            );

            return AppUtils.filterObj<Scrapers.Equipments.Enhancement>({
                stats: this.extractStats(curr),
                success_rate: parseFloat(curr.enchant_chance),
                durability: parseInt(curr.durability?.split('/')[0]),
                cron_values: {
                    next_lvl: parseInt(curr.cron_value),
                    total: parseInt(curr.cron_tvalue),
                },
                effects,
                required_enhancement_item: (lvl >= maxLvl) ? undefined : {
                    type: 'item',
                    id: curr.need_enchant_item_id,
                    icon: '/' + curr.need_enchant_item_icon,
                    name: curr.need_enchant_item_name,
                    shortUrl: url,
                    amount: parseInt(curr.enchant_item_counter),
                    durability_loss_on_failure: parseInt(curr.fail_dura_dec),
                    scrape: this.ScrapeFactory(url),
                },
                perfect_enhancement: (lvl >= maxLvl) ? undefined : {
                    amount: parseInt(curr.pe_item_counter),
                    durability_loss_on_failure: parseInt(curr.pe_dura_dec),
                },
            });
        });
    }

    get caphras_stats(): Scrapers.Equipments.Caphras.Wrapper {
        const data = this.parseCaphrasData();
        return [18, 19, 20].reduce((caphras, eLvl) => {
            const values = (data[eLvl as 18 | 19 | 20] || []).map(cLvl => {
                return AppUtils.filterObj<Scrapers.Equipments.Caphras.Enhancement>({
                    stats: this.extractStats(cLvl.stats),
                    count_next: parseInt(cLvl.count),
                    count_total: parseInt(cLvl.tcount),
                });
            });
            return { ...caphras, [eLvl]: values };
        }, {});
    }

    get item_effects(): string[] {
        const data = this.parseEnchantmentArray()[0].edescription;
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Item Effect'],
        });
        return this.parseEffects(data, matcher);
    }

    get set_effects(): Record<number, string[]> {
        const data = this.parseEnchantmentArray()[0].edescription;
        
        return [2, 3, 4, 5].reduce((effects, set) => {
            const matcher = new Matcher(this._locale, {
                [App.Locales.US]: [`${set}-Set Effect`],
            });
            if (!matcher.in(data))
                return effects;
            return { ...effects, [set]: this.parseEffects(data, matcher) };
        }, {});
    }

    get exclusive_to(): string[] {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Exclusive'],
        });
        this.getBodyNodes(true).find(node => matcher.in(node.data));
        if (!matcher.length)
            return [];
        return (matcher.last as string)
            .substring(matcher.indexIn(matcher.last, true))
            .split(',')
            .map(s => AppUtils.cleanStr(s, ':'))
            .filter(e => e);
    }

    get fairy_exp(): number {
        const matcher = new Matcher(this._locale, {
            [App.Locales.US]: ['Used as Fairy growth item'],
        });
        this.getBodyNodes(true).find(node => matcher.in(node.data));
        if (!matcher.length)
            return 0;
        return parseInt(matcher.last?.replace(/\D/g, '') || '0');
    }

    async build(): Promise<Scrapers.Entities.Equipment> {
        return {
            ...(await super.build()),
            stats: this.stats,
            enhancement_stats: this.enhancement_stats,
            caphras_stats: this.caphras_stats,
            item_effects: this.item_effects,
            set_effects: this.set_effects,
            exclusive_to: this.exclusive_to,
            fairy_exp: this.fairy_exp,
        };
    }
}