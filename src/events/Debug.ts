import { DiscordAPIError, Events } from 'discord.js'
import { logger } from '../utils'

module.exports = {
     name: Events.Debug,
     once: true,
     execute(msg: DiscordAPIError) {
          logger.debug(msg)
     },
}
