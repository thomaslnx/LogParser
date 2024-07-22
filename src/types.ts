export interface Killers {
  [key: string]: number;
}

export interface GamersList {
  id: number | undefined;
  name: string | undefined;
}

export type DeathBy = 
  'MOD_UNKNOWN' |
	'MOD_SHOTGUN' |
	'MOD_GAUNTLET' |
	'MOD_MACHINEGUN' |
	'MOD_GRENADE' |
	'MOD_GRENADE_SPLASH' |
	'MOD_ROCKET' |
	'MOD_ROCKET_SPLASH' |
	'MOD_PLASMA' |
	'MOD_PLASMA_SPLASH' |
	'MOD_RAILGUN'|
	'MOD_LIGHTNING' |
	'MOD_BFG' |
	'MOD_BFG_SPLASH' |
	'MOD_WATER' |
	'MOD_SLIME' |
	'MOD_LAVA' |
	'MOD_CRUSH' |
	'MOD_TELEFRAG' |
	'MOD_FALLING'|
	'MOD_SUICIDE' |
	'MOD_TARGET_LASER' |
	'MOD_TRIGGER_HURT' |
  'MOD_GRAPPLE'


export interface MatchData {
  total_kills: number;
  players: string[];
  kills: Killers;
  kills_discounted_killed_by_world?: Killers,
  killByMeans?: {
    [key: string | DeathBy]: number
  }
  killedByWorldPlayer?: {
    [key: string]: number
  }
}

export interface CurrentMatch {
  [key: string]: MatchData
}

export interface GameLog {
  [key: string]: MatchData
}