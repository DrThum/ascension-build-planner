export type Spell = {
  spellId: number;
  spellName: string;
  description: string
}

export type CollectedCard = {
  cardId: number;
  rank: number;
}

export enum CardType {
  AbilityNormal = 'ABILITY_NORMAL',
  AbilityGolden = 'ABILITY_GOLDEN',
  TalentNormal = 'TALENT_NORMAL',
  TalentGolden = 'TALENT_GOLDEN',
}

export enum CardFamily {
  Ability = 'ABILITY',
  Talent = 'TALENT',
}

export type CardCollection = {
  abilityNormal: CollectedCard[],
  abilityGolden: CollectedCard[],
  talentNormal: CollectedCard[],
  talentGolden: CollectedCard[],
}
