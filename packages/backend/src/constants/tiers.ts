export enum UserTier {
    INITIATE = 'INITIATE', // Free
    VANGUARD = 'VANGUARD', // Premium
    COMMANDER = 'COMMANDER' // Ultimate
}

export const TIER_LEVELS = {
    [UserTier.INITIATE]: 0,
    [UserTier.VANGUARD]: 1,
    [UserTier.COMMANDER]: 2
};

export const TIER_NAMES = {
    [UserTier.INITIATE]: 'Initiate',
    [UserTier.VANGUARD]: 'Vanguard',
    [UserTier.COMMANDER]: 'Commander'
};
