import dotenv from 'dotenv'
dotenv.config();

import fs from 'node:fs'
import { ICommand } from './src/types'
import path from 'node:path'
import { REST, Routes } from 'discord.js'
import { logger } from './src/utils';


// const { REST, Routes } = require('discord.js')
const {
     Client,
     Collection,
     GatewayIntentBits,
     Partials,
} = require('discord.js')
const client = new Client({
     intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildInvites,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
     ],
     partials: [Partials.Channel, Partials.Message],
})



client.commands = new Collection()

let commands: ICommand[] = []

start()
async function start() {
     // Записываем "token" || "login" в .env

     const config = require(path.join(__dirname, '../config.json'))
     process.env.loliland_login = config.loliland_login
     process.env.loliland_pass = config.loliland_token

     // Подключаем слэш-команды/команды/кнопки
     loadSlashCommands(path.join(__dirname, 'src/commands/slash'))
}

async function loadSlashCommands(currentPath: string) {
     const inFolders = fs.readdirSync(currentPath)

     inFolders.map((element) => {
          let pathElement = currentPath + '/' + element
          let data = fs.statSync(pathElement)

          if (data.isFile()) {
               try {
                    const command = require(pathElement)
                    if (
                         'permissionsAccess' in command &&
                         'permissionsDenied' in command &&
                         'data' in command &&
                         'execute' in command
                    ) {
                         client.commands.set(command.data.name, command)
                         commands.push(command.data.toJSON())
                    } else {
                         logger.warn(
                              `[WARNING] The command at ${pathElement} is missing a required "permissionsAccess" or "permissionsDenied" or "data" or "execute" property.`,
                         )
                    }
               } catch (e) {
                    logger.error(e)
               }
          }

          if (data.isDirectory()) {
               return loadSlashCommands(pathElement)
          }
     })
}

const eventsPath = path.join(__dirname, 'src/events')
const eventFiles = fs
     .readdirSync(eventsPath)
     .filter((file) => file.endsWith('.js'))

for (const file of eventFiles) {
     const filePath = path.join(eventsPath, file)
     const event = require(filePath)
     if (event.once) {
          client.once(event.name, (...args: any) =>
               event.execute(...args, client),
          )
     } else {
          client.on(event.name, (...args: any) =>
               event.execute(...args, client, commands),
          )
     }
}
//@ts-ignore
const rest = new REST().setToken(process.env.TOKEN)

;(async () => {
     try {
          logger.info(
               `Started refreshing ${commands.length} application (/) commands.`,
          )

          // The put method is used to fully refresh all commands in the guild with the current set
          
          const data: any = await rest.put(
               //@ts-ignore
               Routes.applicationCommands(process.env.clientID),
               {
                    body: commands,
               },
          )

          logger.info(
               `Successfully reloaded ${data?.length} application (/) commands.`,
          )
     } catch (error) {
          // And of course, make sure you catch and log any errors!
          logger.error(error)
     }
})()

client.login(process.env.TOKEN)
