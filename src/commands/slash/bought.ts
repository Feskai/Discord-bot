import {
     ChatInputCommandInteraction,
     Client,
     SlashCommandBuilder,
     codeBlock
} from 'discord.js'
import { IBoughtParams, IProductData, IProductItem, IProductParams } from '../../types';
import { getMessageWebSocket, normalTime } from '../../utils';

const itemsPerPage: number = 10;
const timeWipe: number = 1726866000000; //* wipe 21.09.2024


const data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> =
     new SlashCommandBuilder()
          .setName('bought')
          .setDescription('sent greeting message!')
          .addStringOption((option) =>
               option.setName('nick').setDescription('nick').setRequired(true),
          )
          .addStringOption((option) =>
               option.setName('filter').setDescription('nick'),
          )
          .addStringOption((option) =>
               option.setName('wipe').setDescription('за вайп?').addChoices(
                    { name: 'Да', value: 'yes' },
                    { name: 'Нет', value: 'no' },
               ),
          )

module.exports = {
     data,
     permissionsAccess: [
          'owner',
          '1262078334825926666',
          '1196837502552653945',
          '1196837530109218827',
          '1196837612808327270',
          '1196837640067096707',
          '1196838070914392176',
     ],
     permissionsDenied: [],
     async execute(interaction: ChatInputCommandInteraction, client: Client) {

          interaction.deferReply({ ephemeral: true });

          const nick: string = interaction.options.getString('nick', true);
          const filter: string = interaction.options.getString('filter') ?? '';
          const choice: string = interaction.options.getString('wipe') ?? 'yes';

          let nicks: string[] = [];
          let filterArray: string[] = [filter];


          let isManyNicks: string[] = nick.trim().split(' '); //* Если через nick (пробел) nick
          // if (isManyNicks.length < 1) isManyNicks = nick.trim().split(','); //* Если через nick, nick
          if (isManyNicks.length < 1) isManyNicks = [];

          console.log(isManyNicks)

          if (isManyNicks.length > 0) {
               for (let index = 0; index < isManyNicks.length; index++) {
                    getBought({
                         interaction, client, nick,
                         isWipe: choice == 'yes' ? true : false,
                         filter: filterArray.length > 0 ? filterArray : []
                    })
                    continue;

               }
          } else {
               getFullTransaction({
                    nick,
                    page: 1,
                    array: []
               })
          }
     },
}


let groupByN = (n: number, arr: any[]) => {
     let result = []
     for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n))
     return result
}

async function getFullTransaction(options: IProductParams): Promise<IProductData> {
     const { nick, page } = options;
     let { array } = options;


     let products = await getMessageWebSocket({
          packets: ['account.authToken', 'account.history'],
          dates: [
               {
                    "login": process.env.loliland_login,
                    "key": process.env.loliland_pass,
               },
               {
                    "login": nick,
                    "page": page,
               },
          ]
     })

     if (products[1].type == 'error') {
          return {
               type: 'error',
               items: [],
               pages: 0,
               error: products[1]
          }
     }


     if (Object.keys(products[1].histories).length > 0) {
          // Запись покупок в массив
          for (var i = 0; i < Object.keys(products[1].histories).length; i++) {
               array.push(products[1]?.histories[i])
          }
          // Возвращение покупок и всего страниц
          if (products[1].pages === page) {
               return {
                    items: array,
                    pages: products[1].pages,
                    type: products[1].type
               }
          }

          // Просмотр следующей страницы.
          return getFullTransaction({
               page: page + 1,
               nick,
               array
          })
     } else {
          return {
               items: array,
               pages: products[1].pages,
               type: products[1].type
          }
     }
}


async function getBought(options: IBoughtParams): Promise<void> {
     const { interaction, nick, client } = options;
     let {
          filter,
          isWipe,
          isSortedWipe,
          isSortedFilter,
          beforeItems,
          beforePages
     } = options;

     if (!beforeItems) beforeItems = [];
     if (!beforePages) beforePages = 0;
     if (!filter) filter = [];


     if (typeof isSortedFilter == 'undefined') isSortedFilter = false;
     if (typeof isSortedWipe == 'undefined') isSortedWipe = false;
     if (typeof isWipe == 'undefined') isWipe = true;


     let products = await getFullTransaction({
          nick,
          page: 1,
          array: []
     })

     let currentItems: IProductItem[] = beforeItems.length > 0 ? beforeItems : products.items;
     let page = beforePages > 0 ? beforePages : 1


     if (filter.length > 0 && !isSortedFilter) {
          let newItems: IProductItem[] = [];

          currentItems.map((item) => {
               filter.map((filt) => {
                    if (item.text.toLowerCase().includes(filt)) {
                         newItems.push(item)
                    }
               })
          })

          if (newItems.length < 1) {
               newItems.push({
                    date: 1,
                    text: 'нету',
                    plus: true,
                    price: 1
               })
          }


          return getBought({
               interaction, nick, client, isWipe,
               beforeItems: newItems,
               beforePages: page,
               isSortedFilter: true
          })
     }

     if (isWipe && !isSortedWipe) {
          let newItems: IProductItem[] = [];

          // console.log(JSON.stringify(currentItems, (_, v) => typeof v === 'bigint' ? v.toString() : v, ' '))

          currentItems.map((item) => {
               if (item.date >= timeWipe) {
                    newItems.push(item)
               }
          })

          if (newItems.length < 1) {
               newItems.push({
                    date: 1,
                    text: 'нету',
                    plus: true,
                    price: 1
               })
          }

          return getBought({
               interaction, nick, client, isSortedFilter, isWipe,
               beforeItems: newItems,
               beforePages: page,
               isSortedWipe: true,

          })

     }


     //! Если покупок нету

     if (currentItems.length < 1 || currentItems[0]?.text == 'нету') {
          let choice = isSortedWipe ? `за вайп` : (isSortedFilter ? 'по данному фильтру' : '');

          await interaction.followUp({
               content: codeBlock('js', `${nick} не имеет покупок ${choice}`),
               ephemeral: true
          })
          return;
     }


     let groupItems: IProductItem[][] = groupByN(itemsPerPage, currentItems); //* Разделение массива на подмоссив при достижение N кол-ва в изначальном массиве
     let text: string = `Покупки игрока ${nick} | Страница: ${page} / ${groupItems.length}\n`; //* Текст вывода сообщения
     let buttons: any = { //* Кнопка
          type: 1,
          components: []
     };



     if (groupItems.length > 1) {
          buttons?.components.push({
               type: 2,
               custom_id: "previousPage",
               label: "<===",
               style: 2
          })
          buttons?.components.push({
               type: 2,
               custom_id: "currentPage",
               label: page,
               style: 2
          })
          buttons?.components.push({
               type: 2,
               custom_id: "nextPage",
               label: "==>",
               style: 2
          })
     }

     let sendComponents = buttons.components.length > 0 ? [buttons] : [];

     groupItems[page - 1].map((item) => {
          text += `[${normalTime(item.date).formattedDate}]: ${item.text} | ${item.plus ? "+" : "-"} ${item.price}\n`
     })

     let response = await interaction.followUp({
          content: codeBlock('json', text),
          components: sendComponents,
          ephemeral: true
     })
     text = '';

     if (groupItems.length > 1) {
          const collectorFilter = (i: any) => i.user.id === interaction.user.id;

          try {
               const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 600_000 });


               //* Проверка кнопок


               if(confirmation.customId == 'nextPage') {
                    if((page+1) > groupItems.length) {
                         interaction.followUp({ content: 'Извините, но следующей страницы нету', ephemeral: true, components: sendComponents })
                         return;
                    }
                    options['beforePages'] = page + 1;
                    return getBought(options)
               } else if(confirmation.customId == 'previousPage') {
                    if((page-1) < groupItems.length) {
                         interaction.followUp({ content: 'Извините, но предыдущей страницы нету', ephemeral: true, components: sendComponents })
                         return;
                    }
                    options['beforePages'] = page - 1;
                    return getBought(options)
               } else if(confirmation.customId == 'currentPage') {
                    interaction.followUp({ content: `Текущая страница: ${page} / ${groupItems.length}`, ephemeral: true, components: sendComponents  });
                    return
               }

          } catch (e) {
               console.log('error collectorFilter b.js: ', JSON.stringify(e, (_, v) => typeof v === 'bigint' ? v.toString() : v, ' '))
               await interaction.editReply({ content: 'Confirmation not received within 10 minute, cancelling', components: [] });
          }
     }

     return;
}