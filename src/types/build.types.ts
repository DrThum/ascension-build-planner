export type Build = {
  id: number | undefined;
  name: string;
  abilityCardIds: number[];
  talentCardIds: number[];
  cardedSetup: {
    abilityNormalIds: number[]; // Max 2
    abilityGoldenIds: number[]; // Max 2
    talentNormalIds: number[]; // Max 3
    talentGoldenIds: number[]; // Max 3
  };
};
