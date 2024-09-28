import { Client } from 'discord.js';
import pino from 'pino';
import WebSocket from 'ws';

interface INormalTime {
     currentMonth: boolean,
     formattedDate: string
}

interface IMessage {
     packets: string[],
     dates: object[]
}

interface ICheckToken {
     login: string,
     token: string
}

interface IPartition {
     list: any[],
     n: number
}


export function getNormalTimeInMinutes(seconds: number = 0) {
     let sec = seconds;
     let min = 0;
     let hour = 0;
     let day = 0;

     while (sec >= 60) {
          sec -= 60;
          min += 1;
     }

     while (min >= 60) {
          min -= 60;
          hour += 1;
     }
     while (hour >= 24) {
          hour -= 24;
          day += 1
     }


     let text: string = '';
     if (day > 0) text += `${day} д. `;
     if (hour > 0) text += `${hour} ч. `;
     if (min >= 0) text += `${min} м. `;
     if (sec >= 0) text += `${sec} с. `;

     return text;
}
export function normalTime(unixTime: number) {
     const date = new Date(Math.round(unixTime)); // Convert microseconds to milliseconds by dividing by 1000

     const currentDate = new Date();
     const formattedDate = date.toLocaleString("ru-RU");

     return {
          currentMonth: date.getMonth() == currentDate.getMonth(),
          formattedDate: formattedDate
     };
}
export function getMessageWebSocket(options: IMessage): Promise<any> {
     let {
          packets,
          dates
     } = options;

     // let packet = 'banlist.load';
     let sendDate: string[] = []
     let _sendDate: string[] = [];
     return new Promise((resolve, reject) => {
          //@ts-ignore
          const ws = new WebSocket(process.env.wss_uri);

          ws.on("open", () => {
               if (packets.length > 0) {
                    packets.map((x, index) => {
                         ws.send(
                              JSON.stringify({
                                   packet: x,
                                   data: !!dates[index] ? dates[index] : {}
                              })
                         )
                    })
               }
          });
          ws.on('error', function error(err) {
               reject(err);
               console.log('websocket error: ', JSON.stringify(err, null, '\t'))
          })
          ws.on('message', function incoming(message) {
               const array: any = JSON.parse(message.toString('utf-8'));
               if (packets.length > 0) {
                    packets.map((x, index) => {
                         if (array['packet'] == x.toString()) {
                              let c = sendDate.find((y: any) => y.name === array['packet']);
                              if (c) return;
                              if (!c) {
                                   // @ts-ignore
                                   sendDate.push({
                                        name: array['packet']
                                   })
                                   _sendDate.push(array['data'])
                              }
                         }
                         if (packets.length === sendDate.length) {
                              // @ts-ignore
                              resolve(_sendDate)
                              ws.close()
                         }
                    })
               }
          })

          ws.on('close', function close() { })
     })
}

export function partition(options: IPartition) {
     const {
          list,
          n
     } = options;

     const isPositiveInteger = Number.isSafeInteger(n) && n > 0
     if (!isPositiveInteger) {
          throw new RangeError('n must be a positive integer')
     }

     const partitions = []

     for (let i = 0; i < list.length; i += n) {
          const partition = list.slice(i, i + n)
          partitions.push(partition)
     }

     return partitions
}

export function sleep(ms: number) {
     return new Promise((resolve) => {
          setTimeout(resolve, ms)
     })
}

export async function fetchAllMessages(client: Client, channelId: string) {
     const channel = client.channels.cache.get(channelId.toString())
     let messages: any = []

     // Create message pointer
     // @ts-ignore
     let message = await channel.messages
          .fetch({ limit: 1 })
          .then((messagePage: any) => messagePage)
          .catch((err: any) => {
               logger.error(err)
          })

     while (message) {
          // @ts-ignore
          await channel.messages
               .fetch({ limit: 100, before: message.id })
               .then((messagePage: any) => {
                    messagePage.forEach((msg: any) => messages.push(msg))

                    // Update our message pointer to be the last message on the page of messages
                    message =
                         0 < messagePage.size
                              ? messagePage.at(messagePage.size - 1)
                              : null
               })
               .catch((err: any) => {
                    logger.error(err)
               })
     }

     // console.log(messages);  // Print all messages
     return messages
}

export interface ICheckReturn {
     type: string,
     data: object[],
     options?: ICheckToken
}

export async function checkToken(options: ICheckToken) {
     const { login, token } = options

     let data: any = await getMessageWebSocket({
          packets: ['account.authToken'],
          dates: [
               {
                    login: login,
                    key: token,
               }
          ]
     })

     data = {
          type: data['type'],
          data: data,
          options,
     }

     return data;
}

const transport = pino.transport({
     target: "pino-pretty",
     options: {
          colorize: true,
     },
});
export const logger = pino(transport);