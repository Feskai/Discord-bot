import { DiscordAPIError, Events } from 'discord.js'
import { logger } from '../utils'

module.exports = {
     name: Events.Error,
     once: true,
     execute(error: DiscordAPIError) {
          logger.error(error)
     },
}
