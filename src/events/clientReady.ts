import { Events, Client } from "discord.js";
import { logger } from '../utils'

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client) {
		logger.info(`I'm started! ${client?.user?.username}`);
	},
};