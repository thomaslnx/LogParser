import { Transform, TransformCallback } from 'node:stream'
import { CurrentMatch, GameLog, DeathBy } from './types'

class LogTransform extends Transform {
  originalFileSize: number
  totalBytesRead: number = 0
  currentMatchId: number = 0

  gameLog: GameLog[] = []

  constructor(originalFileSize: number) {
    super()
    this.originalFileSize = originalFileSize
  }

  _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
    const chunkToString = chunk.toString()
    
    this.#processChunk(chunkToString)
    
    /**
     * Logic for the calculation of the percentage of the reading stream process
     * this.totalBytesRead += chunk.length
     * let parsedPercentage = (this.totalBytesRead / this.originalFileSize) * 100
     * console.log('parsedPercentage value: ', `${parsedPercentage}%`)
    */
    
    
    /**
     * Initial writing test of the transform stream
     * callback(null, chunk)
     * this returns just one chunk of data and done.
     * this.push(chunk) 
    */

    try {
      callback(null, JSON.stringify(this.gameLog, null, 2))
    } catch (error: any) {
      console.error('Error parsing data for file writing!')
      callback(error)
    }
    
  }

  /**
   * Implement the log_parsed with the data parsed return
   */
  #processChunk(chunkToString: string) {
    /**
     * Regex to extract from the log file the game data between the first InitGame and last ShutdownGame words
    */ 
    const gameMatchDataRegex = /(InitGame:(.*?)ShutdownGame)/gsmi
    let gameLogArray: string[][] = []
    
    /**
     * SPLIT EVERY InitGame AND ShutdownGame INTO ITS OWN ARRAY POSITION 
    */
    const initGameMatch = chunkToString.match(gameMatchDataRegex)
    initGameMatch?.map(result => {
      const stringSplitted = result.split('downGame:')
      gameLogArray.push(stringSplitted)
    })

    /*
    *  Array with all matches occupying one position of this array
    */
   gameLogArray.map(matches => {
     const totalGamersOnCurrentMatch = matches.map(currentMatch => {
       this.currentMatchId += 1 // increment the number of the current match.
       
       let playersOfTheMatch: Array<{ id: number, name: string }> = []
       
       let gameMatch: CurrentMatch = {
         [`game_${this.currentMatchId}`]: {
           total_kills: 0,
           players: [],
           kills: {},
           kills_discounted_killed_by_world: {},
           killByMeans: {},
           killedByWorldPlayer: {}
         }
       }
       // grab the name and id of each one of the games and save in a array of objects
       // ensuring to save just on of each gamer id.
       const gamerNameAndIdRegex = /(?<=ClientUserinfoChanged:\s)(.*?\\)(.*?\\)/gsmi
       
       // Kills count regex [Count the total_kills of the match and add it to the game log]
       const killsRegex = /(Kill:\s(.*)$)$/gmi
       currentMatch.match(killsRegex)
                    ?.toString()
                    .split('\n')
                    .map(kill => kill.split(','))
                    .map(kill => gameMatch[`game_${this.currentMatchId}`].total_kills = kill.length)

        /**
         * Logic for the count of deaths by <world> player
        */
        const killedByWorldPlayerRegex = /(?<=<world>\skilled\s)(.*?by)/gsmi
        const killedByWorldPlayerMatches = currentMatch.match(killedByWorldPlayerRegex)
                                                       ?.map(playerKilled => playerKilled.replace(' by', ''))

        let killedByWorldPlayer: {[key: string]: number} = {}
        killedByWorldPlayerMatches?.forEach(killedByWorld => {
          if (killedByWorldPlayer[killedByWorld]) {
            killedByWorldPlayer[killedByWorld]++
          } else {
            killedByWorldPlayer[killedByWorld] = 1
          }
        })

        gameMatch[`game_${this.currentMatchId}`].killedByWorldPlayer = killedByWorldPlayer

        let kills_discounted_killed_by_world: {[key: string]: number} = {}

        /**
         * Logic for counting and listing all the kills by means of each match
        */
        const killsByMeansRegex = /(?<=by\s)(.*?\n)/gsmi
        const killsByMeansMatches = currentMatch.match(killsByMeansRegex)
                                                ?.map(killMean => killMean.replace('\n', ''))

        let killsByMeans: {[key: string | DeathBy]: number} ={}
        killsByMeansMatches?.forEach(killMean => {
          if (killsByMeans[killMean]) {
            killsByMeans[killMean]++
          } else {
            killsByMeans[killMean] = 1
          }
        })

        gameMatch[`game_${this.currentMatchId}`].killByMeans = killsByMeans

        /**
         * Logic for the count of kills(deaths) from the all another match players
        */
        const playersKillsRegex = /[K|k]ill:\s(.*?\n)/gsmi
        currentMatch.match(playersKillsRegex)
                    ?.toString()
                    .split('\n')
                    .map(kill => kill.split(','))
                    .map(string => {
                      return string.filter(word => word !== '')
                    })

        const killersCountRegex = /(?<=([Kill:]\s)(\d{1}\s{1}\d{1}\s{1}))(\d{0,2}:\s)(.*?)(.*?k)/gsmi // regex closer than I need
        const removeFirstCharactersRegex = /(.*\d:\s)/gm
        const killersCountMatches = currentMatch.match(killersCountRegex)
                                                ?.map(player => {
                                                  let parsedPlayer = player.replace(removeFirstCharactersRegex, '')
                                                  const lastSpaceIndex = parsedPlayer.lastIndexOf(' ')
                                                  const kRemoved = parsedPlayer.slice(0, lastSpaceIndex)

                                                  return kRemoved
                                                })

        let kills: {[key: string]: number } = {}
        
        killersCountMatches?.forEach(playerKiller => {
          if (kills[playerKiller]) {
            kills[playerKiller]++
          } else {
            kills[playerKiller] = 1
          }
        })

        /**
         * Logic for the calculation and remove 1 point from player when its is
         * killed by player world
        */
        Object.keys(killedByWorldPlayer).forEach(player => {
          if (kills[player]) {
            kills_discounted_killed_by_world[player] = kills[player] - killedByWorldPlayer[player]
            gameMatch[`game_${this.currentMatchId}`].kills_discounted_killed_by_world = kills_discounted_killed_by_world
          } else if (!kills[player]) {
            kills_discounted_killed_by_world[player] = -killedByWorldPlayer[player]
            gameMatch[`game_${this.currentMatchId}`].kills_discounted_killed_by_world = kills_discounted_killed_by_world
          }
        })

        gameMatch[`game_${this.currentMatchId}`].kills = kills
        let listOfPlayers: string[] = []

        const removeDuplicates = (players: string[]): string[] => {
          return [...new Set(players)]
        }

        currentMatch.match(gamerNameAndIdRegex)
                    ?.toString()
                    .replace(/\sn\\/g, ': ')
                    .replace(/\\/g, '')
                    .split(',')
                    .map(gamer => gamer.split(': '))
                    .map(player => {
                                      const playerCheck = (currentPlayer: { id: number }) => currentPlayer.id !== parseInt(player[0])
                                      let currentPlayer: { id: number, name: string } = {} as any
                                        
                                      if (playersOfTheMatch.length === 0 || playersOfTheMatch.some(playerCheck)) {
                                        currentPlayer!.id = parseInt(player[0]),
                                        currentPlayer!.name = player[1]
                                        listOfPlayers.push(player[1])
                                      }
                                      
                                      playersOfTheMatch.push(currentPlayer!)
                                      return currentPlayer
                                    })

        const uniquePlayers = removeDuplicates(listOfPlayers)
        gameMatch[`game_${this.currentMatchId}`].players = uniquePlayers
        this.gameLog.push(gameMatch)
        return this.gameLog
      })

      return totalGamersOnCurrentMatch
    })
  }
}

export default LogTransform