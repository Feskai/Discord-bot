import { ChatInputCommandInteraction, Client, Interaction } from "discord.js";

export interface ICommand {
     permissionsAccess: string[],
     permissionsDenied: string[],
     data: any,
     execute: (interaction: Interaction, client: Client, data?: any[]) => void
}


export interface IProductItem {
     date: number;
     price: number;
     text: string;
     plus: boolean;
}

export interface IProductData {
     items: IProductItem[];
     type: 'success' | 'error';
     pages: number;
     error?: string | object;
}

export interface IProductParams {
     nick: string;
     page: number;
     array: IProductItem[];
}

export interface IBoughtParams {
     interaction: ChatInputCommandInteraction;
     client: Client;
     nick: string;
     beforeItems?: IProductItem[];
     beforePages?: number;
     filter?: string[];
     isWipe?: boolean;
     isSortedFilter?: boolean;
     isSortedWipe?: boolean;
}