export type Build = {
  id: number | undefined;
  name: string;
  notes?: string;
  abilityCardIds: number[];
  talentCardIds: number[];
  startAbilityCardIds?: number[];
  cardedSetup: {
    abilityNormalIds: number[]; // Max 2
    abilityGoldenIds: number[]; // Max 2
    talentNormalIds: number[]; // Max 3
    talentGoldenIds: number[]; // Max 3
  };
};

export type ImportBuildData = {
  skills: number[];
  talents: number[];
  carded: {
    ability: {
      normal: number[];
      golden: number[];
    };
    talent: {
      normal: number[];
      golden: number[];
    };
  };
};
