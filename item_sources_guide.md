# Ninja Saga - Item Sources Guide

Reference document untuk agent frontend. Menjelaskan dari mana saja setiap item bisa didapatkan.

> **PENTING**: Satu item bisa didapatkan dari BANYAK sumber. Contoh: `wpn_01` (Kunai) ada di Normal Shop (gold), PvP Shop (pvp points), DAN punya prestige price. Selalu treat sources sebagai **array**.

---

## Quick Detection: Cara Tahu Item dari Mana

### Dari Field di `library.json` (items) dan `skills.json`

| Field | Condition | Source(s) |
|-------|-----------|-----------|
| `buyable` | `true` | Normal Shop, Clan Shop, PvP Shop, Crew Shop, Academy |
| `price_gold` | `> 0` | Normal Shop, Clan Shop, Academy |
| `price_tokens` | `> 0` | Various shops, Limited Store, Special Deals |
| `price_pvp` | `> 0` | **PvP Shop only** |
| `item_price_pvp` | `> 0` | **PvP Shop only** (skills) |
| `price_prestige` | `> 0` | **Clan Forge / Clan Shop** |
| `price_merit` | `> 0` | **Shadow Crew Shop** |
| `premium` | `true` | Cash Shop, Special Deals, Limited Store |
| `buyable` | `false` | Event, Forge, Gacha, Mission Drop, Discontinued |

### Dari `gamedata.json` (cross-reference item ID)

Cek apakah item ID muncul di:
- `shop.normal.weapons/backs/accs/...` → Normal Shop
- `shop.clan.weapons/backs/...` → Clan Shop  
- `shop.pvp.weapons/backs/...` → PvP Shop
- `shop.crew.weapons/backs/...` → Crew Shop
- `academy.wind/fire/thunder/earth/water/taijutsu/genjutsu` → Academy
- `dragon_gacha.top/mid/common` → Dragon Gacha
- `scratch.rewards/grand_prize` → Daily Scratch
- `sow.wind/fire/thunder/earth/water` → Scroll of Wisdom
- Event keys (`anniv2026`, `christmas2025`, dll) → Seasonal Events

### Dari Hardcoded Scripts

- `BlacksmithData.weaponList` → Blacksmith Forge
- `ForgeDataClan.data` → Clan Forge (wpn_6004-wpn_6081)
- `ContestShop.wpnArray/backArray` → Contest Shop
- `SenjutsuShop.toadSkillArray/snakeSkillArray` → Senjutsu Shop

---

## All 42 Item Sources

### A. Shops (Beli Langsung)

| # | Source ID | Label | Currency | Requirement |
|---|-----------|-------|----------|-------------|
| 1 | `shop_normal` | Normal Shop | Gold, Tokens | - |
| 2 | `shop_clan` | Clan Shop | Gold, Tokens | Harus di clan |
| 3 | `shop_pvp` | PvP Shop | Gold, Tokens, PvP Points | PvP access |
| 4 | `shop_crew` | Shadow Crew Shop | Gold, Tokens, Merit | Harus di crew |
| 5 | `pet_shop` | Pet Shop | Gold, Tokens | - |
| 6 | `talent_shop` | Bloodline Shop | Tokens | Level req |
| 7 | `senjutsu_shop` | Senjutsu Shop | SP | Lv80 + Ninja Tutor Exam |
| 8 | `friendship_shop` | Friendship Shop | Friendship Kunai | Punya kunai (10 items dumped, see below) |
| 9 | `animation_shop` | Animation Shop | Tokens | - |
| 10 | `contest_shop` | Contest Shop | Tokens, Contest Points | Contest participation |
| 11 | `limited_store` | Limited Store | Tokens | 12 skills in pool, rotating per player (dumped, see below) |
| 12 | `special_deals` | Special Deals | Tokens | - |
| 13 | `billing_packages` | Cash Shop | Real Money | - |

### B. Forge / Crafting

| # | Source ID | Label | Currency | Requirement |
|---|-----------|-------|----------|-------------|
| 14 | `blacksmith` | Blacksmith | Gold + Tokens + Magatama | Base weapon + materials |
| 15 | `material_market` | Material Market | Materials | Punya materials (50 items dumped, see below) |
| 16 | `hunting_market` | Hunting Market | Hunting Materials | Lv20 + Rank 3 (34 weapons dumped, see below) |
| 17 | `clan_forge` | Clan Item Upgrade | 50K Prestige + Materials | Harus di clan |
| 18 | `pet_combination` | Pet Fusion | Pets | Punya pets |

### C. Gacha / Random

| # | Source ID | Label | Currency | Requirement |
|---|-----------|-------|----------|-------------|
| 19 | `dragon_gacha` | Dragon Gacha | Dragon Coin / Tokens | - (permanent) |
| 20 | `daily_gacha` | Daily/Event Gacha | Event Coin / Tokens | Event active |
| 21 | `anniversary_gacha` | Anniversary Gacha | Event Coin / Tokens | Event active |
| 22 | `christmas_gacha` | Christmas Gacha | Event Coin / Tokens | Event active |

### D. Daily / Login Rewards

| # | Source ID | Label | Requirement |
|---|-----------|-------|-------------|
| 23 | `daily_rewards` | Daily Login | Login harian |
| 24 | `daily_roulette` | Daily Roulette | Spin harian |
| 25 | `daily_scratch` | Daily Scratch | Scratch harian |
| 26 | `daily_stamp` | Daily Stamp | Consecutive login |
| 27 | `welcome_login` | Welcome Login | New/returning player |

### E. Battle / Mission Rewards

| # | Source ID | Label | Requirement |
|---|-----------|-------|-------------|
| 28 | `mission_reward` | Mission Rewards | Complete mission |
| 29 | `arena_rewards` | Arena/PvP Rewards | PvP participation |
| 30 | `crew_battle` | Crew Battle Rewards | Crew battle |
| 31 | `clan_war` | Clan War Rewards | Clan war participation |
| 32 | `hunting_house` | Hunting House Drops | Lv20 + Rank 3 |
| 33 | `monster_hunter` | Monster Hunter | Monster hunter access |
| 34 | `dragon_hunt` | Dragon Hunt | - |
| 35 | `eudemon_garden` | Eudemon Garden | Lv10 |

### F. Special Features

| # | Source ID | Label | Requirement |
|---|-----------|-------|-------------|
| 36 | `divine_tree` | Divine Tree | - |
| 37 | `justice_badge` | Justice Badge | - |
| 38 | `scroll_of_wisdom` | Scroll of Wisdom | Punya scroll |
| 39 | `spin_mission` | Spin Mission | - |
| 40 | `giveaway_center` | Giveaway Center | Redeem code |
| 41 | `redeem_ticket` | Redeem Ticket | Punya ticket |
| 42 | `event_seasonal` | Seasonal Events | Event active |

### G. Exams (Rank Promotion)

| # | Source ID | Label | Requirement |
|---|-----------|-------|-------------|
| 43 | `chunin_exam` | Chunin Exam | Lv20 |
| 44 | `jounin_exam` | Jounin Exam | Lv60 + Chunin |
| 45 | `special_jounin_exam` | Special Jounin Exam | Lv80 |
| 46 | `ninja_tutor_exam` | Ninja Tutor Exam | Lv80 |

### H. Other

| # | Source ID | Label |
|---|-----------|-------|
| 47 | `mailbox` | Admin Gifts via Mailbox |
| 48 | `set_packages` | Themed Set Packages (14 different sets) |
| 49 | `academy` | Academy (basic skills) |
| 50 | `advanced_academy` | Advanced Academy (skill upgrades) |

---

## Item Type → Possible Sources Matrix

| Item Type | Possible Sources |
|-----------|-----------------|
| **wpn** (weapon) | shop_normal, shop_clan, shop_pvp, shop_crew, blacksmith, material_market, hunting_market, clan_forge, contest_shop, limited_store, dragon_gacha, daily_gacha, anniversary_gacha, christmas_gacha, divine_tree, justice_badge, monster_hunter, dragon_hunt, friendship_shop, special_deals, set_packages, event_seasonal, mission_reward, arena_rewards, giveaway_center, redeem_ticket, clan_war, mailbox |
| **back** (back item) | shop_normal, shop_clan, shop_pvp, shop_crew, material_market, hunting_market, contest_shop, limited_store, dragon_gacha, daily_gacha, divine_tree, justice_badge, monster_hunter, dragon_hunt, friendship_shop, special_deals, set_packages, event_seasonal, arena_rewards, clan_war, giveaway_center, redeem_ticket, mailbox |
| **accessory** | shop_normal, shop_pvp, shop_crew, material_market, hunting_market, limited_store, dragon_gacha, daily_gacha, justice_badge, friendship_shop, special_deals, set_packages, event_seasonal, arena_rewards, giveaway_center, mailbox |
| **set** (outfit) | shop_normal, shop_pvp, shop_crew, material_market, hunting_market, limited_store, dragon_gacha, daily_gacha, divine_tree, justice_badge, friendship_shop, special_deals, set_packages, event_seasonal, clan_war, giveaway_center, redeem_ticket, mailbox |
| **hair** | shop_normal, shop_pvp, shop_crew, material_market, hunting_market, event_seasonal, clan_war, mailbox |
| **skill** | academy, advanced_academy, shop_pvp, material_market, hunting_market, limited_store, scroll_of_wisdom, special_deals, event_seasonal, mailbox |
| **senjutsu_skill** | senjutsu_shop |
| **talent** (bloodline) | talent_shop |
| **pet** | pet_shop, tailed_beast, material_market, hunting_market, dragon_gacha, daily_gacha, dragon_hunt, pet_combination, event_seasonal, mailbox |
| **item** (consumable) | shop_normal, shop_clan, shop_crew, friendship_shop, mission_reward, daily_rewards, daily_roulette, daily_scratch, daily_stamp, event_seasonal, spin_mission, giveaway_center, redeem_ticket, mailbox |
| **essential** | shop_normal, shop_clan, shop_pvp, shop_crew, daily_rewards |
| **material** | hunting_house, mission_reward, monster_hunter, dragon_hunt, divine_tree, event_seasonal, spin_mission, material_market |
| **animation** | animation_shop |

---

## Seasonal Events (2025-2026)

Setiap event punya sub-sources sendiri:

| Sub-Source | Description |
|------------|-------------|
| `event_boss_drop` | Drop dari boss event |
| `event_milestone_reward` | Reward milestone (battle count) |
| `event_gacha` | Gacha khusus event |
| `event_training` | Training reward |
| `event_package` | Paket event (beli tokens) |
| `event_minigame` | Reward minigame event |
| `event_spending_reward` | Reward spending tokens |
| `event_wishing_tree` | Wishing tree reward |
| `event_clothing` | Event clothing/outfit |

### Active Events in gamedata.json:
- valentine2025, anniv2025, ramadhan2025, easter2025, wmg2025
- sumer2025, independence2025, yinyang2025, halloween2025
- confrontingdeath2025, thanksgiving2025, christmas2025
- phantomkyunoki2026, valentine2026, anniv2026, ramadhan2026, hanami2026

---

## Bloodline Types (19 total)

Dari `talent_info` di gamedata.json:

| ID | Name |
|----|------|
| eightext | Eight Extremities |
| eom | Eye of Mirror |
| de | Dark Eye |
| dp | Dark Power |
| orochi | Orochi |
| sm | Shadow Master |
| saint | Saint |
| insect | Insect |
| sound | Sound |
| wood | Wood |
| shadow | Shadow |
| lava | Lava |
| ice | Ice |
| iron | Iron |
| crystal | Crystal |
| eoc | Eye of Chaos |
| lm | Light Master |
| dm | Dark Master |
| kot | King of Toad |

---

## Cara Pakai File Ini

### Untuk Frontend Agent:

1. **Load `item_sources.json`** sebagai reference data
2. **Untuk setiap item**, cek:
   - Field-field di item data (`buyable`, `price_*`, `premium`)
   - Cross-reference ID di `gamedata.json` shop categories
   - Cross-reference di hardcoded lists (Blacksmith, ClanForge, ContestShop, dll)
3. **Build array `sources`** per item berdasarkan semua match
4. **Display** sebagai tags/badges di UI (contoh: "Shop", "Forge", "Event", "Gacha")

### Contoh Output per Item:

```json
{
  "id": "wpn_01",
  "name": "Kunai",
  "sources": [
    {"source_id": "shop_normal", "currency": "gold", "price": 70},
    {"source_id": "shop_pvp", "currency": "pvp_points", "price": 1000},
    {"source_id": "clan_forge", "currency": "prestige", "price": 100000}
  ]
}
```

```json
{
  "id": "skill_01",
  "name": "Lightning Edge",
  "sources": [
    {"source_id": "academy", "element": "thunder", "currency": "gold", "price": 100}
  ]
}
```

```json
{
  "id": "wpn_609",
  "name": "(Blacksmith weapon)",
  "sources": [
    {"source_id": "blacksmith", "requires": {"base_weapon": "wpn_03", "materials": ["material_01"], "gold": 1000, "tokens": 100}}
  ]
}
```

---

## Material Market - Dumped Items (50 total)

> Data di-dump dari AMF response `MaterialMarket.getItems` pada April 2026.
> Server bisa rotate items, jadi list ini mungkin berubah seiring waktu.
> Full data + recipe requirements ada di `dump/material_market.json`.

### Weapons (11)
`wpn_2101`, `wpn_2194`, `wpn_2414`, `wpn_2415`, `wpn_2416`, `wpn_2424`, `wpn_2430`, `wpn_2431`, `wpn_2432`, `wpn_2433`, `wpn_2434`

### Back Items (8)
`back_2412`, `back_2413`, `back_2414`, `back_2439`, `back_2440`, `back_2441`, `back_2442`, `back_2443`

### Sets (8)
`set_136_0`, `set_786_0`, `set_2419_0`, `set_2420_0`, `set_2435_0`, `set_2436_0`, `set_2437_0`, `set_2438_0`

### Skills (14)
`skill_377`, `skill_806`, `skill_807`, `skill_808`, `skill_809`, `skill_810`, `skill_845`, `skill_2336`, `skill_2337`, `skill_2343`, `skill_2350`, `skill_2351`, `skill_2352`, `skill_2353`

### Hair (6)
`hair_2378_0`, `hair_2379_0`, `hair_2394_0`, `hair_2395_0`, `hair_2396_0`, `hair_2397_0`

### Pets (2)
`pet_littlejyubi`, `pet_mikocat`

### Accessories (1)
`accessory_53`

### Materials Used as Ingredients (16)
`material_2076`, `material_2077`, `material_2078`, `material_2237`, `material_2238`, `material_2239`, `material_2240`, `material_2241`, `material_2242`, `material_2243`, `material_2244`, `material_2245`, `material_2246`, `material_2247`, `material_2248`, `material_2249`

---

## Hunting Market - Dumped Items (34 weapons)

> Data di-dump dari AMF response `HuntingHouse.getItems` pada April 2026.
> Full data + recipe requirements ada di `dump/hunting_market.json`.

### Weapons (34)
`wpn_822` - `wpn_855` (sequential range)

Full list: `wpn_822`, `wpn_823`, `wpn_824`, `wpn_825`, `wpn_826`, `wpn_827`, `wpn_828`, `wpn_829`, `wpn_830`, `wpn_831`, `wpn_832`, `wpn_833`, `wpn_834`, `wpn_835`, `wpn_836`, `wpn_837`, `wpn_838`, `wpn_839`, `wpn_840`, `wpn_841`, `wpn_842`, `wpn_843`, `wpn_844`, `wpn_845`, `wpn_846`, `wpn_847`, `wpn_848`, `wpn_849`, `wpn_850`, `wpn_851`, `wpn_852`, `wpn_853`, `wpn_854`, `wpn_855`

### Hunting Materials (34)
`material_600` - `material_633` (used as forge ingredients)

---

## Friendship Shop - Dumped Items (10 items)

> Data di-dump dari AMF response `FriendService.getItems` pada April 2026.
> Currency: Friendship Kunai (`material_1002`). Harga naik per tier (20-150 kunai).

| # | Item | Price (Kunai) |
|---|------|---------------|
| 1 | `gold_50000` | 20 |
| 2 | `hair_2150_0` | 20 |
| 3 | `tokens_25` | 50 |
| 4 | `back_2133` | 50 |
| 5 | `set_2186_0` | 60 |
| 6 | `back_2145` | 60 |
| 7 | `tokens_50` | 70 |
| 8 | `wpn_2112` | 100 |
| 9 | `wpn_2217` | 140 |
| 10 | `skill_654` | 150 |

---

---

## Limited Store - Dumped Skills (12 skills)

> Data di-dump dari AMF response `MysteriousMarket.getAllPackagesList` pada April 2026.
> Pool global, tapi player hanya lihat 1-4 skill sekaligus (bisa reroll dengan tokens).

| # | Skill ID | Name |
|---|----------|------|
| 1 | `skill_508` | Shield Bash |
| 2 | `skill_854` | Aphrodites Blessing |
| 3 | `skill_723` | Deadman Assault |
| 4 | `skill_386` | Dark Demonic Illusion Bewitching Eyes |
| 5 | `skill_862` | Kinjutsu: Advanced Bijuu Armor |
| 6 | `skill_721` | Kinjutsu: Advanced Deadly Sickle |
| 7 | `skill_703` | Kinjutsu: Monarch of Thunder Plus |
| 8 | `skill_369` | Phantom Impulse |
| 9 | `skill_860` | Kinjutsu: Bijuu Claw |
| 10 | `skill_393` | Tenson Omi Korin & Gongen |
| 11 | `skill_9007` | Bijuu Bomb Plus |
| 12 | `skill_803` | Extreme Rabbit Boxing |

---

## Server-Side Sources (Not Dumped)

| Source | Reason Not Dumped |
|--------|-------------------|
| **Event Gacha** | Item pools already in `gamedata.json` (dragon_gacha, anniv2026, christmas2025, etc.) |
| **Pet Combination** | Not a shop — combines 2 owned pets → random result. Rules server-side. |
