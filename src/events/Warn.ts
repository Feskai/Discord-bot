import { DiscordAPIError, Events } from 'discord.js'
import { logger } from '../utils'

module.exports = {
     name: Events.Warn,
     once: true,
     execute(warn: DiscordAPIError) {
          logger.warn(warn)
     },
}
