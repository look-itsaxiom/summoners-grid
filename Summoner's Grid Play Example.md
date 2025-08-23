# Summoner's Grid - Detailed Play Example

## Game Setup

**Match Type:** 3v3 Tactical Battle  
**Players:** Player A vs Player B

Player A logs in and is presented with the main menu of the game. After reviewing what's new, they decide to queue for a game. They select the game type 3v3 and are presented with a deck selection screen. Already having a deck built, they select it and confirm their choice. After a short wait, they are matched against Player B and the game begins.

**Turn Order:** The game begins with a coin flip, with each player randomly assigned to Heads or Tails. Player A wins the coin flip, and is presented the option to go first or second. Player A chooses to go first.

**Board Setup:** The 12x14 game board is animatedly "built" in front of them, with each player's territory highlighted on their respective sides of the board. Each player's 3 Summon Cards are shown in each player's hands and the game begins.

---

## Turn 1 - Player A

### Draw Phase

As Player A is going first, they do not draw a card during their Draw Phase.

### Level Phase

Similarly, as they have no Summons in play, nothing happens during their Level Phase.

### Action Phase

Player A enters their Action Phase and surveys their Summons in hand: a **Gignen Warrior**, a **Gignen Scout**, and a **Gignen Magician**.

**Turn Summon:** They decide on the Gignen Warrior and using their Turn Summon, they initiate playing the card by selecting it and selecting a valid space in their territory: space coordinate **(5,2)**. ((0,0) would be the bottom left space of the board)

The Summon Card enters the In Play Zone, revealing it to Player B and prompting a response. With no response available from Player B, the Summon Unit materializes on the game board and its stats and properties are calculated:

> **Player A's Summon:** Species: Gignen, Role: Warrior, Level 5, HP 96/96, MV 2, STR 18, END 13, DEF 15, INT 15, SPI 13, MDF 11, SPD 12, LCK 19, ACC 12, Growth Rates: STR 1.33, END 1, DEF 1, INT 0.66, SPI 1, MDF 0.66, SPD 0.5, LCK 2, ACC 0.66, Equipment: "Heirloom Sword" (034-heirloom_sword-Alpha)

**Summon Draws:** Successfully performing their Turn Summon, Player A draws their 3 Summon Draws, adding them to their hand: **"Sharpened Blade"**, **"Healing Hands"**, and **"Rush"**. All Action cards with various effects and requirements.

**Playing Sharpened Blade:** Player A selects the now playable "Sharpened Blade" Action card which has the requirement of having a Warrior Summon in play, and targets their Gignen Warrior for its effect.

Player A's "Sharpened Blade" enters the In Play Zone and with no response available from Player B, resolves its effect: _"Target Weapon equipped to a Warrior based Summon gains +10 Base Power."_

Player A's Gignen Warrior's Weapon "Heirloom Sword"'s Base Power increases from 30 to 40 indefinitely. Once the effect resolves, "Sharpened Blade" is moved to Player A's Recharge Pile.

**Movement:** Finally, Player A selects their Gignen Warrior and moves it 2 spaces forward into unclaimed territory **(5,4)**, and initiates ending their Action Phase.

### End Phase

Player A enters their End Phase, with no responses to resolve, Player A's turn ends and Player B's turn begins.

---

## Turn 2 - Player B

## Turn 2 - Player B

### Draw Phase

Player B begins their turn by drawing a card from their Main Deck, adding it to their hand during their Draw Phase. The card they draw is **"Drain Touch"**.

### Level Phase

With no Summons in play, nothing happens during their Level Phase.

### Action Phase

Player B enters their Action Phase and inspects their Summons in hand: a **Stoneheart Warrior**, a **Fae Magician**, and a **Wilderling Scout**.

**Turn Summon:** Player B selects the Fae Magician and using their Turn Summon, they initiate playing the card by selecting it and selecting a valid space in their territory: space coordinate **(5,11)**.

The Summon Card enters the In Play Zone, revealing it to Player A and prompting a response. With no response available from Player A, the Summon Unit materializes on the game board and its stats and properties are calculated:

> **Player B's Summon:** Species: Fae, Role: Magician, Level 5, HP 96/96, MV 3, STR 13, END 13, DEF 15, INT 19, SPI 20, MDF 16, SPD 15, LCK 13, ACC 14, Growth Rates: STR 1, END 1, DEF 1, INT 1.33, SPI 1.33, MDF 1, SPD 1, LCK 1, ACC 1.33, Equipment: "Apprentice's Wand" (035-apprentices_wand-Alpha)

**Summon Draws:** Successfully performing their Turn Summon, Player B draws their 3 Summon Draws, adding them to their hand: **"Blast Bolt"**, **"Dark Altar"**, and **"Ensnare"**. 2 Action cards and a Building card.

**Movement and Attack:** Reading the requirements for Blast Bolt, Player B moves their Fae Magician to **(5,10)** to be within its range, then selects the now playable "Blast Bolt" Action card which has the requirement of having a Magician Summon in play, designates their Magician as the caster, and targets Player A's Gignen Warrior for its effect.

Player B's "Blast Bolt" enters the In Play Zone and with no response available from Player A, resolves its damaging effect.

#### Combat Resolution: Blast Bolt

**Hit Calculation:**  
Because Blast Bolt has a base accuracy of 85 and its hit formula is designated to use the default standard one, we first need to determine if the attack hits:

- ToHit = 85 + (Player B's Fae Magician ACC / 10) = 85 + (14 / 10) = **86.4%**
- Random roll: **42** (hits!)

**Critical Hit Check:**  
Because Blast Bolt's effect is designated as one that can crit, we need to determine if the attack crits. Blast Bolt designates to use the standard crit formula and its crit multiplier is 1.5x damage.

- CritChance = Floor((Player B's Fae Magician LCK x 0.3375) + 1.65) = Floor((13 x 0.3375) + 1.65) = Floor(4.3875 + 1.65) = Floor(6.0375) = **6%**
- Random roll: **73** (no crit)

**Damage Calculation:**  
Now we can calculate the damage dealt by the attack using the formula designated by the card: _"caster.INT x (1 + base_power /100) x (caster.INT / target.MDF)"_

Blast Bolt has a base power of 60 and the type of damage it deals is magical fire attribute damage.

- Damage = Player B's Fae Magician INT x (1 + 60 / 100) x (Player B's Fae Magician INT / Player A's Gignen Warrior MDF)
- Damage = 19 x (1 + 60 / 100) x (19 / 11) = 19 x 1.6 x 1.7272 = 52.45408
- **Final Damage: 52** (rounded down)

The last step in determining damage dealt is to apply any additional factors that may modify the damage dealt. In this case, there are no additional factors to consider, so the final damage dealt is 52.

**Result:** Player A's Gignen Warrior takes 52 damage, reducing its HP from 96 to **44**.

Once the effect resolves, "Blast Bolt" is moved to Player B's Discard Pile, as designated by the card.

**Movement:** Player B selects their Fae Magician and uses the remaining movement it has to move it 2 spaces back into their territory **(5,12)**, and initiates ending their Action Phase.

### End Phase

Player B enters their End Phase, with no responses to resolve, Player B's turn ends and Player A's turn begins.

---

## Turn 3 - Player A

### Draw Phase

Player A begins their turn by drawing a card from their Main Deck, adding it to their hand during their Draw Phase. The card they draw is **"Gignen Country"**.

### Level Phase

With their Gignen Warrior in play, it levels up from 5 to 6 during their Level Phase.

**Stat Recalculation:** Player A's Gignen Warrior's stats are recalculated for level 6 per its Growth Rates:

> HP **50/102**, MV 2, STR 19, END 14, DEF 16, INT 15, SPI 14, MDF 11, SPD 13, LCK 21, ACC 12

Player A notes that their Warrior didn't stay at 44 HP, but rather the damage it has received was retained and its max HP increased.

### Action Phase

Player A's turn continues into their Action Phase, they inspect their hand to formulate a plan.

**Turn Summon:** Player A begins by using their Turn Summon to play their **Gignen Magician**, selecting a valid space in their territory: space coordinate **(4,2)**.

The Summon Card enters the In Play Zone, revealing it to Player B and prompting a response. With no response available from Player B, the Summon Unit materializes on the game board and its stats and properties are calculated:

> **Player A's Summon:** Species: Gignen, Role: Magician, Level 5, HP 96/96, MV 3, STR 16, END 13, DEF 13, INT 16, SPI 15, MDF 15, SPD 15, LCK 22, ACC 11, Growth Rates: STR 1.33, END 1, DEF 0.5, INT 1.33, SPI 1.33, MDF 1, SPD 1, LCK 2, ACC 0.5, Equipment: "Apprentice's Wand" (036-apprentices_wand-Alpha)

**Summon Draws:** Successfully performing their Turn Summon, Player A draws their 3 Summon Draws, adding them to their hand: **"Nearwood Forest Expedition"**, **"Rush"**, and **"Adventurous Spirit"**. A Quest card, and 2 Action cards.

**Playing Healing Hands:** Now meeting the requirements to play "Healing Hands" by controlling a Magician based Summon as designated on the card, Player A selects it, designates their Magician as the caster, and targets their Gignen Warrior for the card's effect.

Player A's "Healing Hands" enters the In Play Zone and with no response available from Player B, resolves its healing effect.

#### Combat Resolution: Healing Hands

**Critical Heal Check:**  
Because Healing Hands is a healing effect, no to hit calculation is necessary unless designated by the card, which it is not. Healing Hands does designate that the heal can crit, so we need to determine if the heal crits. Healing Hands designates to use the standard crit formula and its crit multiplier is 1.5x healing.

- CritChance = Floor((Player A's Gignen Magician LCK x 0.3375) + 1.65) = Floor((22 x 0.3375) + 1.65) = Floor(7.425 + 1.65) = Floor(9.075) = **9%**
- Random roll: **8** (critical heal!)

**Heal Calculation:**  
Now we can calculate the amount healed using the formula designated by the card: _"caster.SPI _ (1 + base_power /100)"\*

Healing Hands has a base power of 40 and the type of heal it provides is magical light attribute healing.

- Heal Amount = Player A's Gignen Magician SPI \* (1 + Healing Hands base power / 100)
- Heal Amount = 15 _ (1 + 40 / 100) = 15 _ 1.4 = 21

In this case, there are no additional factors to consider, so the base heal amount is 21.

**Critical Multiplier:** Because the heal critted, we apply the crit multiplier of 1.5x to the heal amount: 21 \* 1.5 = 31.5, rounded down to **31**.

**Result:** Player A's Gignen Warrior heals 31 HP, increasing its HP from 50/102 to **81/102**.

Once the effect resolves, "Healing Hands" is moved to Player A's Discard Pile, as designated by the card.

**Playing Building Card:** Player A then decides to play the Building card **"Gignen Country"**, selecting the card from their hand and selecting valid spaces that meet the card's required dimensions: **(4,2), (5,2), (6,2), (4,1), (5,1), (6,1)**

The Building Card enters the In Play Zone, revealing it to Player B and prompting a response. With no response available from Player B, the Building becomes active on the board.

Player A's "Gignen Country" is now in play, providing its ongoing effect: _"While occupying all Gignen based Summons you control receive an additional level whenever they level up."_

**Movement:** Player A then moves their Gignen Warrior 2 spaces backward into their territory **(5,2)**, positioning both their Summons within the Gignen Country occupied spaces.

**Playing Quest Card:** Player A then selects the Quest card **"Nearwood Forest Expedition"** from their hand and plays it.

The Quest Card enters the In Play Zone, revealing it to Player B and prompting a response. With no response available from Player B, the Quest becomes active.

Player A's "Nearwood Forest Expedition" is now in play, activating its objective for completion: _"Control target Warrior, Scout, or Magician based Summon whose current level is under 10."_

**Quest Completion:** Player A currently controls a Gignen Warrior level 6 and a Gignen Magician level 5, so they meet the objective's requirement. Player A selects their Gignen Warrior as the target for the Quest's effect.

With the objective met, Player A completes the Quest, triggering its reward effect: _"Target Summon gains 2 levels"_. With no response available from Player B, the effect resolves.

**Level Up Cascade:** Player A's Gignen Warrior levels up from 6 to 8 during the resolution of the Quest's effect.

Because Player A's Gignen Warrior is within the Gignen Country, each level up it received from the Quest also triggered the Gignen Country's effect, so it levels up an additional 2 levels from 6 to 8, then from 8 to 10.

**Final Stat Recalculation:** Player A's Gignen Warrior's stats are recalculated for level 10 per its Growth Rates:

> HP **132/153**, MV 3, STR 31, END 22, DEF 20, INT 18, SPI 18, MDF 14, SPD 15, LCK 29, ACC 15

With the Quest completed, Nearwood Forest Expedition is moved to Player A's Recharge Pile, as designated by the card.

**Advance Card Play:** Player A then selects a card from their Advance Deck, **"Berserker Rage"**, now eligible to be played as they control a tier 1 Warrior based Summon that is level 10 or higher.

Player A selects "Berserker Rage" from their Advance Deck and targets their Gignen Warrior for the card's effect.

Player A's "Berserker Rage" enters the In Play Zone and with no response available from Player B, resolves its role change effect.

**Role Change:** Player A's Gignen Warrior's Role changes from Warrior to **Berserker** indefinitely. The Berserker's Role has different stat modifiers and triggers stat recalculation.

**Final Stats:** Player A's Gignen Berserker's stats are recalculated for level 10 per its Growth Rates and new Role Modifier:

> HP **146/167**, MV 3, STR 40, END 24, DEF 20, INT 18, SPI 18, MDF 14, SPD 18, LCK 29, ACC 15

### End Phase

Player A finishes their turn by initiating the end of their Action Phase, and entering their End Phase. With no responses to resolve, Player A's turn ends and Player B's turn begins.

---

## Turn 4 - Player B

### Draw Phase

Player B begins their turn by drawing a card from their Main Deck, adding it to their hand during their Draw Phase. The card they draw is **"Dramatic Return!"**.

### Level Phase

With their Fae Magician in play, it levels up from 5 to 6 during their Level Phase.

**Stat Recalculation:** Player B's Fae Magician's stats are recalculated for level 6 per its Growth Rates:

> HP **102/102**, MV 3, STR 14, END 14, DEF 16, INT 26, SPI 27, MDF 17, SPD 16, LCK 14, ACC 15

### Action Phase

Player B begins their Action Phase by inspecting their hand to formulate a plan.

**Turn Summon:** Player B uses their Turn Summon to play their **Wilderling Scout**, selecting a valid space in their territory: space coordinate **(6,11)**.

The Summon Card enters the In Play Zone, revealing it to Player A and prompting a response. With no response available from Player A, the Summon Unit materializes on the game board and its stats and properties are calculated:

> **Player B's Summon:** Species: Wilderling, Role: Scout, Level 5, HP 114/114, MV 5, STR 18, END 16, DEF 12, INT 13, SPI 13, MDF 10, SPD 28, LCK 18, ACC 23, Growth Rates: STR 0.66, END 1, DEF 1, INT 1.5, SPI 0.5, MDF 0.66, SPD 2, LCK 1.5, ACC 2, Equipment: "Hunting Bow" (036-hunting_bow-Alpha)

**Summon Draws:** Successfully performing their Turn Summon, Player B draws their 3 Summon Draws, adding them to their hand: **"Graverobbing"**, **"Dual Shot"**, and **"Spell Recall"**. A Counter card, and 2 Action cards.

**Setting Counter Cards:** Player B selects **"Dramatic Return!"** from their hand, and sets it face down in the In Play Zone.

With no response available from Player A, "Dramatic Return!" is now face down in the In Play Zone, ready to be activated when its trigger condition is met.

Player B then selects **"Graverobbing"** from their hand, and sets it face down in the In Play Zone.

With no response available from Player A, "Graverobbing" is now face down in the In Play Zone, ready to be activated when its trigger condition is met.

**Strategic Assessment:** Player B notes that they are unable to move either of their units far enough to enter either of their unit's weapon ranges to attack Player A's Gignen Berserker, so they decide to end their Action Phase.

### End Phase

Player B enters their End Phase, with no responses to resolve, Player B's turn ends and Player A's turn begins.

---

## Turn 5 - Player A

### Draw Phase

Player A begins their turn by drawing a card from their Main Deck, adding it to their hand during their Draw Phase. The card they draw is **"Tempest Slash"**.

### Level Phase

With their Gignen Berserker and Gignen Magician in play, they both level up during their Level Phase.

**Gignen Berserker Level Up:** Player A's Gignen Berserker levels up from 10 to 11, then from 11 to 12 during their Level Phase due to the Gignen Country's effect.

**Stat Recalculation:** Player A's Gignen Berserker's stats are recalculated for level 12 per its Growth Rates:

> HP **169/190**, MV 4, STR 44, END 27, DEF 22, INT 19, SPI 20, MDF 15, SPD 20, LCK 33, ACC 16

**Gignen Magician Level Up:** Player A's Gignen Magician levels up from 5 to 6, then from 6 to 7 during their Level Phase due to the Gignen Country's effect.

**Stat Recalculation:** Player A's Gignen Magician's stats are recalculated for level 7 per its Growth Rates:

> HP **108/108**, MV 3, STR 19, END 15, DEF 14, INT 24, SPI 22, MDF 17, SPD 17, LCK 26, ACC 12

### Action Phase

Player A begins their Action Phase by inspecting their hand to formulate a plan.

**Turn Summon:** Player A uses their Turn Summon to play their **Gignen Scout**, selecting a valid space in their territory: space coordinate **(6,1)**.

The Summon Card enters the In Play Zone, revealing it to Player B and prompting a response. With no response available from Player B, the Summon Unit materializes on the game board and its stats and properties are calculated:

> **Player A's Summon:** Species: Gignen, Role: Scout, Level 5, HP 120/120, MV 4, STR 15, END 17, DEF 13, INT 15, SPI 16, MDF 14, SPD 23, LCK 27, ACC 16, Growth Rates: STR 1, END 1.33, DEF 1, INT 1, SPI 1, MDF 1, SPD 1.33, LCK 2, ACC 1.33, Equipment: "Hunting Bow" (037-hunting_bow-Alpha)

**Summon Draws:** Successfully performing their Turn Summon, Player A draws their 3 Summon Draws, however their Main Deck is out of cards, so they must shuffle their Recharge Pile to form a new Main Deck, then draw their 3 Summon Draws.

Still not having enough cards for all 3 draws, Player A draws as many as they can, adding them to their hand: **"Nearwood Forest Expedition"** and **"Sharpen Blade"**. A Quest card and an Action card.

**Playing Rush:** Player A then selects **"Rush"** from their hand, selecting their Gignen Berserker as the target for the card's effect.

Player A's "Rush" enters the In Play Zone and with no response available from Player B, resolves its effects.

Rush has multiple effects: it first doubles the target's movement speed until the end of the turn, then it cuts the target's DEF in half until the end of the opponent's next turn.

- Player A's Gignen Berserker's movement speed is doubled from 4 to **8** until the end of the turn.
- Player A's Gignen Berserker's DEF is halved from 22 to **11** until the end of Player B's next turn.

Once the effect resolves, "Rush" is moved to Player A's Recharge Pile.

**Playing Tempest Slash:** Next, Player A selects **"Tempest Slash"** from their hand, selecting their Gignen Berserker as the target for the card's effect.

Player A's "Tempest Slash" enters the In Play Zone and with no response available from Player B, resolves its effects.

First, it adds an additional movement to the target's movement speed until the end of the turn, then it adds an additional damaging effect to the target's next basic attack until the end of the turn.

- Player A's Gignen Berserker's movement speed is increased from 8 to **9** until the end of the turn.
- Player A's Gignen Berserker's next basic weapon attack will deal Tempest Slash's additional damage effect using the formula: _"caster.STR x (1 + base_power /100) x (caster.STR / target.DEF)"_ with a base power of 30 and physical wind attribute damage.
- Additionally, if the attack is a critical hit, Tempest Slash's effect damage is also doubled.

Once the effect resolves, "Tempest Slash" is moved to Player A's Discard Pile.

**Strategic Movement:** Now that Player A's Gignen Berserker has a movement speed of 9, they select it and move it across the entire board to **(4,11)** to be within basic attack range of Player B's Fae Magician and within enemy territory.

**Basic Attack:** **Basic Attack:** Player A then selects their Gignen Berserker and initiates a basic attack against Player B's Fae Magician.

#### Combat Resolution: Berserker vs Fae Magician

**To Hit Calculation:**

- ToHit = 90 + (Player A's Gignen Berserker ACC / 10) = 90 + (16 / 10) = **91.6%**
- Random roll: **27** (hit!)

**Critical Hit Check:**

- CritChance = Floor((Player A's Gignen Berserker LCK x 0.3375) + 1.65) = Floor((33 x 0.3375) + 1.65) = Floor(11.1375 + 1.65) = Floor(12.7875) = **12%**
- Random roll: **45** (no critical hit)

**Weapon Damage Calculation:**  
Using the basic attack damage formula: _"STR x (1 + Weapon Power / 100) x (STR / Target DEF) x IF_CRIT"_

- Weapon Damage = Player A's Gignen Berserker STR x (1 + Weapon Power / 100) x (Player A's Gignen Berserker STR / Player B's Fae Magician DEF) x IF_CRIT
- Weapon Damage = 44 x (1 + 40 / 100) x (44 / 16) x 1 = 44 x 1.4 x 2.75 x 1 = **169**

**Tempest Slash Additional Damage:**  
Using Tempest Slash's formula: _"caster.STR x (1 + base_power /100) x (caster.STR / target.DEF)"_

- Tempest Slash Damage = 44 x (1 + 30 / 100) x (44 / 16) = 44 x 1.3 x 2.75 = **157**

**Total Damage:** 169 + 157 = **326 damage**

**Result:** Player B's Fae Magician takes 326 damage, reducing its HP from 102 to **-224**.

Because Player B's Fae Magician's HP has dropped to 0 or below, it is defeated and removed from the game.

**Victory Point Awarded:** Player A is awarded **1 Victory Point** for defeating an opponent's Summon Unit.

**Counter Card Activation:** Player B activates their face down Counter card **"Dramatic Return!"** in response to their Fae Magician being defeated.

Player B's "Dramatic Return!" enters the In Play Zone and with no response available from Player A, resolves its effect.

Dramatic Return!'s effect is to return a defeated Summon back to the board within that player's territory with 10% HP.

Player B selects their Fae Magician as the target for the effect, and selects a valid space in their territory: space coordinate **(5,12)**.

Player B's Fae Magician is returned to the board at (5,12) with 10% HP, which is 10.2 rounded down to **10 HP**.

**Additional Movements:** Player A finishes their turn by moving their other Summons: their Gignen Magician moves 3 spaces forward to **(4,5)**, and their Gignen Scout moves 4 spaces forward to **(6,6)**.

**Scout's Ranged Attack:** Player A is able to make an attack with their Gignen Scout against Player B's Wilderling Scout due to its weapon's high range.

#### Combat Resolution: Scout vs Wilderling Scout

**To Hit Calculation:**

- ToHit = 90 + (Player A's Gignen Scout ACC / 10) = 90 + (16 / 10) = **91.6%**
- Random roll: **49** (hit!)

**Critical Hit Check:**

- CritChance = Floor((Player A's Gignen Scout LCK x 0.3375) + 1.65) = Floor((27 x 0.3375) + 1.65) = Floor(9.1125 + 1.65) = Floor(10.7625) = **10%**
- Random roll: **71** (no critical hit)

**Damage Calculation:**  
Using the basic attack damage formula for bow weapons: _"((STR + ACC) / 2) x (1 + Weapon Power / 100) x (STR / Target DEF) x IF_CRIT"_

- Damage = ((Player A's Gignen Scout STR + Player A's Gignen Scout ACC) / 2) x (1 + 30 / 100) x (15 / 12) x 1 = (31 / 2) x 1.3 x 1.25 x 1 = 15.5 x 1.3 x 1.25 = **25**

**Result:** Player B's Wilderling Scout takes 25 damage, reducing its HP from 114 to **89**.

### End Phase

Player A enters their End Phase, with no responses to resolve, Player A's turn ends and Player B's turn begins.

---

## Turn 6 - Player B

### Draw Phase

Player B begins their turn by drawing a card from their Main Deck, adding it to their hand during their Draw Phase. The card they draw is **"Life Alchemy"**.

### Level Phase

With their Fae Magician and Wilderling Scout in play, they both level up during their Level Phase.

- **Fae Magician** levels up from 6 to 7.
  - Stats recalculated: HP **89/108**, MV 3, STR 15, END 15, DEF 17, INT 27, SPI 29, MDF 18, SPD 18, LCK 15, ACC 17
- **Wilderling Scout** levels up from 5 to 6.
  - Stats recalculated: HP **89/120**, MV 6, STR 18, END 17, DEF 13, INT 15, SPI 14, MDF 10, SPD 31, LCK 20, ACC 25

### Action Phase

Player B inspects their hand and grins to themselves.

**Playing Ensnare:**  
Player B selects **"Ensnare"** from their hand, requiring a Scout based Summon to be in play, designates their Wilderling Scout as the caster, and targets Player A's Gignen Berserker.

- "Ensnare" enters the In Play Zone, no response from Player A, effect resolves.

**Ensnare Combat Resolution:**

- **Hit Calculation:**
  - ToHit = 75 + (ACC / 10) + (LCK / 10) = 75 + 2.5 + 2 = **79.5%**
  - Random roll: **47** (hit)
- **Critical Hit Check:**
  - CritChance = Floor((LCK x 0.3375) + 1.65) = Floor((20 x 0.3375) + 1.65) = Floor(8.4) = **8%**
  - Random roll: **50** (no crit)
- **Damage Calculation:**
  - Damage = STR x (1 + base_power / 100) x (STR / target.DEF)
  - Damage = 18 x 1.25 x 1.6363 = **36** (rounded down)
- **Result:** Player A's Gignen Berserker takes 36 damage, HP: **133**
- **Immobilize Check:**
  - SaveChance = 30%
  - Random roll: **65** (fail)
  - Result: Gignen Berserker is immobilized until the end of Player A's next turn.

"Ensnare" is moved to Player B's Discard Pile.

**Playing Dark Altar:**  
Player B selects **"Dark Altar"** from their hand, selecting valid spaces: (4,11), (3,11), (3,12), (4,12).

- "Dark Altar" enters the In Play Zone, no response from Player A, becomes active.

**Playing Drain Touch:**  
Player B selects **"Drain Touch"** from their hand, Fae Magician as caster, targets Gignen Berserker.

- "Drain Touch" enters the In Play Zone, no response from Player A, resolves.

**Drain Touch Combat Resolution:**

- **Hit Calculation:**
  - ToHit = 90 + (ACC / 10) = 90 + 1.7 = **91.7%**
  - Random roll: **77** (hit)
- **Critical Hit Check:**
  - CritChance = Floor((LCK x 0.3375) + 1.65) = Floor(6.7125) = **6%**
  - Random roll: **33** (no crit)
- **Damage Calculation:**
  - Damage = INT x (1 + base_power / 100) x (INT / target.MDF)
  - Damage = 27 x 1.3 x 1.8 = **63** (rounded down)
- **Result:** Player A's Gignen Berserker takes 63 damage, HP: **70**
- **Healing:**
  - Heal Amount = 63 x 0.5 = **31** (rounded down)
  - Fae Magician heals to **41/108** HP

"Drain Touch" is moved to Player B's Discard Pile.

**Movement:**

- Fae Magician moves 2 spaces back to (5,13)
- Wilderling Scout moves 3 spaces diagonally forward to (3,8)

**Playing Dual Shot:**  
Player B selects **"Dual Shot"** from their hand, targeting Wilderling Scout.

- "Dual Shot" enters the In Play Zone, no response from Player A, resolves.
- Effect: Wilderling Scout can make two basic attacks this turn.
- "Dual Shot" is moved to Player B's Recharge Pile.

**Wilderling Scout's Attacks:**  
Both attacks target Player A's Gignen Magician.

- **First Attack:**

  - ToHit = 90 + (ACC / 10) = 90 + 2.5 = **92.5%**
  - Random roll: **57** (hit)
  - CritChance = Floor((LCK x 0.3375) + 1.65) = Floor(8.4) = **8%**
  - Random roll: **77** (no crit)
  - Damage = ((STR + ACC) / 2) x (1 + Weapon Power / 100) x (STR / Target DEF)
  - Damage = 21.5 x 1.3 x 1.2857 = **35** (rounded down)
  - Gignen Magician HP: **73**

- **Second Attack:**
  - ToHit = **92.5%**
  - Random roll: **3** (hit)
  - CritChance = **8%**
  - Random roll: **10** (no crit)
  - Damage = **35**
  - Gignen Magician HP: **38**

### End Phase

Player B enters their End Phase, with no responses to resolve, Player B's turn ends and Player A's turn begins.

---

## Turn 7 - Player A

### Draw Phase

Player A begins their turn by drawing a card from their Main Deck. However, their Main Deck is out of cards, so they must shuffle their Recharge Pile to form a new Main Deck, then draw their card. If there are no cards available, nothing is drawn.

### Level Phase

All of Player A's Summons in play level up:

- **Gignen Berserker**: Levels from 12 to 13.
  - Stats recalculated: HP **78/203**, MV 4, STR 46, END 28, DEF 23, INT 20, SPI 21, MDF 16, SPD 20, LCK 35, ACC 17
- **Gignen Magician**: Levels from 7 to 8.
  - Stats recalculated: HP **44/114**, MV 3, STR 20, END 16, DEF 15, INT 25, SPI 24, MDF 18, SPD 18, LCK 28, ACC 13
- **Gignen Scout**: Levels from 5 to 6.
  - Stats recalculated: HP **126/126**, MV 4, STR 16, END 18, DEF 14, INT 16, SPI 17, MDF 15, SPD 24, LCK 30, ACC 17

### Action Phase

Player A inspects their hand to formulate a plan to rescue their immobilized Berserker.

**Movement:**

- Gignen Scout moves back 3 spaces to (6,2), entering Gignen Country and out of weapon range of Player B's Wilderling Scout.

**Playing Nearwood Forest Expedition:**  
Player A selects **"Nearwood Forest Expedition"** from their hand and plays it, targeting their Gignen Scout for the Quest's effect.

- The Quest Card enters the In Play Zone, no response from Player B, becomes active.
- Objective: Control a Warrior, Scout, or Magician Summon under level 10.
- Player A selects Gignen Scout (level 6) as the target.

**Quest Completion:**

- Gignen Scout levels up from 6 to 7, then 7 to 8 (from Quest effect).
- Because Gignen Scout is within Gignen Country, each level up also triggers Gignen Country's effect, so it levels up an additional 2 levels: from 8 to 9, then 9 to 10.
- Final stats recalculated for level 10: HP **167/167**, MV 6, STR 20, END 24, DEF 18, INT 20, SPI 21, MDF 19, SPD 31, LCK 40, ACC 23

"Nearwood Forest Expedition" is moved to Player A's Recharge Pile.

**Advance Summon:**  
Player A selects the now eligible Named Summon **"Alrecht Barkstep, Scoutmaster"** from their Advance Deck and plays it, using their Gignen Scout as material.

- The Named Summon Card enters the In Play Zone, no response from Player B, resolves.
- Alrecht Barkstep, Scoutmaster inherits equipment and position from Gignen Scout: (6,2), "Hunting Bow" (037-hunting_bow-Alpha).
- Stats: Species: Gignen, Role: Rogue, Level 10, HP 132/132, MV 7, STR 24, END 19, DEF 14, INT 13, SPI 13, MDF 14, SPD 35, LCK 37, ACC 43, Growth Rates: STR 1.33, END 1, DEF 0.66, INT 0.5, SPI 0.5, MDF 0.66, SPD 1.5, LCK 1.5, ACC 2

Named Summons do not trigger Summon Draws.

**On-Enter Effect:**  
Alrecht Barkstep, Scoutmaster adds its unique Action card **"Follow Me!"** to Player A's hand.

**Playing Follow Me!:**  
Player A selects **"Follow Me!"** from their hand, designates Alrecht Barkstep, Scoutmaster as the caster and Gignen Berserker as the target.

- "Follow Me!" enters the In Play Zone, no response from Player B, resolves.
- Effect: Changes the position of the target Summon to a space adjacent to the caster, ignoring immobilize.
- Player A selects (6,3) and moves Gignen Berserker there.

**Movement:**

- Alrecht Barkstep, Scoutmaster has moved 3 spaces already (inherited), can move 4 more (MV 7), moves to (5,6).

**Basic Attack:**  
Alrecht Barkstep, Scoutmaster attacks Player B's Wilderling Scout.

- **To Hit:** 90 + (ACC / 10) = 90 + (43 / 10) = 94.3%
  - Random roll: **52** (hit)
- **Crit Check:** Floor((LCK x 0.3375) + 1.65) = Floor((37 x 0.3375) + 1.65) = Floor(14.1375) = **14%**
  - Random roll: **20** (crit)
- **Damage:** ((24 + 43) / 2) x 1.3 x (24 / 13) x 1.5 = 33.5 x 1.3 x 1.846... x 1.5 = **130** (rounded down)
- **Result:** Wilderling Scout takes 130 damage, HP: **-41** (defeated, removed from game)

**Victory Point Awarded:**  
Player A is awarded 1 Victory Point (now at 2).

**Counter Card Activation:** Player B activates "Graverobbing" in response to their Wilderling Scout being defeated.

- "Graverobbing" enters the In Play Zone, no response from Player A, resolves.
- Effect: Nullifies the Victory Point gain; Player B discards "Spell Recall" to pay the cost.
- Player A remains at 1 Victory Point.
- "Graverobbing" is moved to Player B's Discard Pile.

**Movement:**

- Gignen Magician moves 2 spaces forward to (4,7).

**End Phase**

Player A initiates the end of their turn. The immobilize status effect on their Gignen Berserker ends. Player A's turn ends and Player B's turn begins.

---

## Turn 8 - Player B

### Draw Phase

Player B begins their turn in their Draw Phase, drawing a card from their Main Deck, adding it to their hand. The card is "Magician's Sanctum".

### Level Phase

With their Fae Magician in play, it levels up from 7 to 8 during their Level Phase.

- **Fae Magician**: Levels from 7 to 8.
  - Stats recalculated: HP **41/114**, MV 3, STR 16, END 16, DEF 18, INT 29, SPI 30, MDF 19, SPD 18, LCK 16, ACC 18

### Action Phase

Player B begins their Action Phase, beginning to worry about the board state.

**Turn Summon:**  
Player B uses their Turn Summon to play their **Stoneheart Warrior**, selecting a valid space in their territory: (4,12), inside the Dark Altar's occupied spaces.

- The Summon Card enters the In Play Zone, no response from Player A, resolves.
- Stats: Species: Stoneheart, Role: Warrior, Level 5, HP 146/146, STR 14, END 12, DEF 11, INT 6, SPI 11, MDF 8, SPD 9, LCK 11, ACC 9, Growth Rates: STR 1.33, END 1, DEF 1, INT 1, SPI 1.33, MDF 1.5, SPD 1, LCK 0.66, ACC 1.5, Equipment: "Heirloom Sword" (038-heirloom_sword-Alpha)

**Summon Draws:**  
Player B draws "Obliterate", "Stonewarden's Command", and "Blast Bolt" (drawing as many as possible, shuffling Recharge Pile if needed).

**Movement:**  
Fae Magician moves 1 space forward to (5,12) to be adjacent to Stoneheart Warrior.

**Playing Life Alchemy:**  
Player B selects **"Life Alchemy"** from their hand, Fae Magician as caster, Stoneheart Warrior as target.

- "Life Alchemy" enters the In Play Zone, no response from Player A, resolves.
- Effect: Deals 25% of Stoneheart Warrior's max HP as damage to it, then heals Fae Magician for the same amount.
- Damage = 146 x 0.25 = 36.5 → **36** (rounded down)
- Stoneheart Warrior HP: 110/146
- Fae Magician heals 36 HP: 41/114 → **77/114**

"Life Alchemy" is moved to Player B's Discard Pile.

**Movement:**  
Fae Magician moves 2 spaces forward to (4,10), placing them in weapon range of Player A's Gignen Magician.

**Basic Attack:**  
Fae Magician attacks Player A's Gignen Magician.

- **To Hit:** 90 + (ACC / 10) = 90 + (18 / 10) = **91.8%**
  - Random roll: **40** (hit)
- **Crit Check:** Floor((LCK x 0.3375) + 1.65) = Floor((16 x 0.3375) + 1.65) = Floor(7.05) = **7%**
  - Random roll: **74** (no crit)
- **Damage Calculation:**  
  Now we can calculate the damage dealt using the basic attack damage formula for the equipped weapon: "INT x (1 + Weapon Power / 100) x (INT / Target MDF) x IF_CRIT"

Damage = Player B's Fae Magician INT x (1 + Weapon Power / 100) x (Player B's Fae Magician INT / Player A's Gignen Magician MDF) x IF_CRIT
Damage = Player B's Fae Magician INT x (1 + 30 / 100) x (Player B's Fae Magician INT / Player A's Gignen Magician MDF) x 1
Damage = 29 x (1 + 30 / 100) x (29 / 18) x 1 = 29 x 1.3 x 1.6111111111111112 x 1 = 76.66666666666667
The damage is rounded down to 76.

**Result:** Player A's Gignen Magician takes 76 damage, reducing its HP from 38 to -38.

Because Player A's Gignen Magician's HP has dropped to 0 or below, it is defeated and removed from the game.

**Victory Point Awarded:** Player B is awarded **1 Victory Point** for defeating an opponent's Summon Unit. They now have 1 Victory Point.

**Playing Magician's Sanctum:**  
Player B selects **"Magician's Sanctum"** from their hand, targeting Fae Magician.

- "Magician's Sanctum" enters the In Play Zone, no response from Player A, resolves.
- Effect: Fae Magician adds half of DEF to MDF or half of MDF to DEF when calculating damage until the end of the opponent's next turn. Ends if the Magician moves.

### End Phase

Player B initiates the end of their turn, which triggers the beginning of Dark Altar's chain of effects.

- Player A is given the opportunity to respond, but with no response available, the effect resolves.
- Dark Altar is destroyed, and Stoneheart Warrior (occupying its spaces) is destroyed as well.
- Dark Altar is moved to Player B's Discard Pile.
- Stoneheart Warrior is removed from the game.

**Dark Altar Effect:**

- Because a Summon was destroyed by Dark Altar, Player B selects Fae Magician as the target, leveling it up to level 20.
- Player A is awarded 1 Victory Point for Stoneheart Warrior being destroyed (now at 2).
- Player B may immediately Advance Summon if Fae Magician is a valid target.

**Advance Summon:**  
Player B selects **"Shadow Pact"** from their Advance Deck, using Fae Magician (now level 20).

- "Shadow Pact" enters the In Play Zone, no response from Player A, resolves.
- Fae Magician's Role changes from Magician to Warlock indefinitely.
- Stats recalculated for level 20: HP **167/198**, MV 6, STR 28, END 28, DEF 30, INT 83, SPI 40, MDF 41, SPD 30, LCK 35, ACC 60

"Shadow Pact" is moved to Player B's Discard Pile.

Player B enters their End Phase, with no responses to resolve, Player B's turn ends and Player A's turn begins.

---

## Turn 9 - Player A

### Draw Phase

Player A begins their turn in their Draw Phase. There are no cards left in their Main Deck or Recharge Pile, so nothing occurs during this phase.

**Alrecht Barkstep, Scoutmaster's effect** adds "Follow Me!" to Player A's hand at the beginning of their turn.

### Level Phase

- **Gignen Berserker**: Levels from 13 to 14.
  - Stats recalculated: HP **84/206**, MV 4, STR 48, END 29, DEF 24, INT 21, SPI 22, MDF 17, SPD 21, LCK 37, ACC 18
- **Alrecht Barkstep, Scoutmaster**: Levels from 10 to 11.
  - Stats recalculated: HP **139/139**, MV 7, STR 25, END 20, DEF 15, INT 13, SPI 13, MDF 15, SPD 37, LCK 39, ACC 45

### Action Phase

Player A knows this is likely their last turn.

**Movement:**

- Alrecht Barkstep, Scoutmaster moves 2 spaces forward to (4,8), placing it in weapon range of Player B's Fae Magician.

**Basic Attack:**  
Alrecht Barkstep, Scoutmaster attacks Player B's Fae Magician.

- **To Hit:** 90 + (ACC / 10) = 90 + (45 / 10) = 94.5%
  - Random roll: **86** (hit)
- **Crit Check:** Floor((LCK x 0.3375) + 1.65) = Floor((39 x 0.3375) + 1.65) = Floor(14.8125) = **14%**
  - Random roll: **40** (no crit)
- **Damage:** ((25 + 45) / 2) x 1.3 x (25 / 50) = 35 x 1.3 x 0.5 = **22** (rounded down)
- Fae Magician HP: 167 → **145**

**Playing Follow Me!:**  
Player A selects "Follow Me!" from their hand, designates Alrecht Barkstep, Scoutmaster as the caster and Gignen Berserker as the target.

- "Follow Me!" enters the In Play Zone, no response from Player B, resolves.
- Effect: Moves Gignen Berserker to a space adjacent to the caster; Player A selects (4,9).

**Basic Attack:**  
Gignen Berserker attacks Player B's Fae Magician.

- **To Hit:** 90 + (18 / 10) = **91.8%**
  - Random roll: **40** (hit)
- **Crit Check:** Floor((37 x 0.3375) + 1.65) = Floor(14.1375) = **14%**
  - Random roll: **19** (no crit)
- **Magician's Sanctum effect:** Fae Magician's DEF is increased by half its MDF (41/2 = 20.5, rounded to 20), so DEF = 50.
- **Damage:** 48 x 1.3 x (48 / 50) = 48 x 1.3 x 0.96 = **60** (rounded down)
- Fae Magician HP: 145 → **85**

**Movement:**  
Gignen Berserker moves 4 spaces away to (5,5) to avoid being attacked.

### End Phase

Player A enters their End Phase. The effects of Magician's Sanctum end. Player A's turn ends and Player B's turn begins.

---

## Turn 10 - Player B

### Draw Phase

Player B draws a card from their Main Deck: "Drain Touch".  
Warlock's Role effect triggers, adding the unique Counter Card "Nightmare Pain" to Player B's hand.

### Level Phase

Fae Magician is already at max level 20, so it does not level up.

### Action Phase

Player B debates which target to pursue to end the game.

**Movement:**  
Fae Magician moves 2 spaces forward to (4,7), placing it in weapon range of Player A's Gignen Berserker.

**Playing Blast Bolt:**  
Player B selects "Blast Bolt" from their hand, Fae Magician as caster, Gignen Berserker as target.

- "Blast Bolt" enters the In Play Zone, no response from Player A, resolves.

**Combat Resolution:**

- **To Hit:** 85 + (18 / 10) = **86.8%**
  - Random roll: **17** (hit)
- **Crit Check:** Floor((16 x 0.3375) + 1.65) = Floor(7.05) = **7%**
  - Random roll: **93** (no crit)
- **Damage:** 83 x 1.3 x (83 / 17) = 83 x 1.3 x 4.882... = **502** (rounded down)
- Gignen Berserker HP: 84 → **-418** (defeated, removed from the game)

**Victory Point Awarded:**  
Player B is awarded 2 Victory Points for defeating a tier 2 or higher Summon (now at 3).

Player A is given the opportunity to respond, but with no response available, Player B wins the game by reaching 3 Victory Points.

---

**Game Over - Player B Wins!**
