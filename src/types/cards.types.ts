export type Card = {
  normalCardId: number;
  goldenCardId: number;
  quality: CardQuality;
  maxRank: number;
  requiredLevel: number;
  spells: Spell[];
};

export type Spell = {
  id: number;
  name: string;
  description: string;
  rank: number;
};

export type CollectedCard = {
  cardId: number;
  rank: number;
};

export enum CardType {
  AbilityNormal = 'ABILITY_NORMAL',
  AbilityGolden = 'ABILITY_GOLDEN',
  TalentNormal = 'TALENT_NORMAL',
  TalentGolden = 'TALENT_GOLDEN',
}

export enum CardQuality {
  Uncommon = 'SKILL_CARD_UNCOMMON',
  Common = 'SKILL_CARD_COMMON',
  Rare = 'SKILL_CARD_RARE',
  Epic = 'SKILL_CARD_EPIC',
  Legendary = 'SKILL_CARD_LEGENDARY',
}

export enum CardCategory {
  Ability = 'ABILITY',
  Talent = 'TALENT',
}

export enum CardSlotType {
  None = 'NONE',
  Starting = 'STARTING',
  Normal = 'NORMAL',
  Golden = 'GOLDEN',
}

export type CardCollection = {
  abilityNormal: CollectedCard[];
  abilityGolden: CollectedCard[];
  talentNormal: CollectedCard[];
  talentGolden: CollectedCard[];
};
