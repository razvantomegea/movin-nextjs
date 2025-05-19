import { IUserStake } from '@/lib/hooks/useMovinEarn';
import { IStake } from '@/lib/supabase/stake';
import { mapUserStakeToDB } from './mapUserStakeToDB';
import { matchUserStakeWithDB } from './matchUserStakeWithDB';

export function prepareUpdateStakesInDB({
  dbStakes,
  userStakes,
  address,
}: {
  dbStakes: IStake[];
  userStakes?: IUserStake[];
  address: string;
}) {
  const stakesToCreate: Partial<IStake>[] = [];
  const stakesToUpdate: Partial<IStake>[] = [];

  if (!userStakes?.length) {
    return { stakesToCreate, stakesToUpdate };
  }

  // For new stakes, check if any stakes exist on blockchain but not in DB
  // Create an array to track blockchain stakes that need to be added
  for (const blockchainStake of userStakes) {
    // Check if this stake already exists in DB
    const existingStake = dbStakes.find((s: IStake) => matchUserStakeWithDB(blockchainStake, s));

    if (!existingStake) {
      // Only add stakes that don't exist in DB
      stakesToCreate.push(mapUserStakeToDB(blockchainStake, address));
    } else {
      const mappedStake = mapUserStakeToDB(blockchainStake, address);

      if (mappedStake.is_active) {
        mappedStake.rewards = (mappedStake.rewards || 0) + existingStake.rewards;
      }

      stakesToUpdate.push({ ...mappedStake, id: existingStake.id });
    }
  }

  return { stakesToCreate, stakesToUpdate };
}
