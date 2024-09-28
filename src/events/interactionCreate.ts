//  else if (interaction.isButton())

import {
     Client,
     codeBlock,
     Events,
     Interaction,
} from 'discord.js'
import { ICommand } from '../types'
import path from 'node:path'
import { logger } from '../utils'

module.exports = {
     name: Events.InteractionCreate,
     async execute(
          interaction: Interaction,
          client: Client
     ) {
          if (interaction.isChatInputCommand()) {

               //@ts-ignore
               const command: ICommand = interaction?.client?.commands.get(
                    interaction.commandName,
               )

               if (!command) {
                    console.error(
                         `No command matching ${interaction.commandName} was found.`,
                    )
                    return
               }

               try {
                    return command.execute(interaction, client)
               } catch (error) {
                    if (interaction.replied || interaction.deferred) {
                         await interaction.followUp({
                              content: 'There was an error while executing this command!',
                              ephemeral: true,
                         })
                    } else {
                         await interaction.reply({
                              content: 'There was an error while executing this command!',
                              ephemeral: true,
                         })
                    }
               }
          }
     },
}
