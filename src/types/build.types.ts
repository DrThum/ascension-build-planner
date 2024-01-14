export type Build = {
  id: number | undefined;
  name: string;
  abilitiesCards: number[];
  talentsCards: number[];
  cardedSetup: {
    abilityNormal: number[]; // Max 2
    abilityGolden: number[]; // Max 2
    talentNormal: number[]; // Max 3
    talentGolden: number[]; // Max 3
  }
}
