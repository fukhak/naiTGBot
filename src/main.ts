import TelegramBot from 'node-telegram-bot-api';
import { NaiHelper, NaiUser } from 'naihelper.js';

declare module globalThis {
    var pointLock: () => boolean;
}

async function main() {

	var token = process.env.TOKEN;
	var naiKey = process.env.NAIKEY;
	var pointLock = JSON.parse((process.env.POINTLOCK ?? 'false').toLowerCase());

	if (token === undefined || naiKey === undefined) {
		console.log('warning: token or neiKey not set');
		process.exit();
	}

    const naiUser = new NaiUser(naiKey!);
    const bot = new TelegramBot(token!, { polling: true });
    const botUsername = (await bot.getMe()).username;

    naiUser.token = await NaiHelper.login(naiUser.key);

    bot.on('message', async (msg) => {
        try {
            console.log(msg.chat.id);
            
            if (msg.date < Math.floor(Date.now() / 1000) - 5) {
                console.log('outdate message: ')
                console.log('Group: ' + (msg.chat.title ?? '') + ', user: ' + (msg.from?.first_name ?? '') + (msg.from?.last_name ?? '') + ': ' + (msg.text ?? ''));
                return;
            }

            if (!(msg.chat.type == "group" || msg.chat.type == "supergroup")){
                console.log('No Allowed message: ')
                console.log('Group: ' + (msg.chat.title ?? '') + ', user: ' + (msg.from?.first_name ?? '') + (msg.from?.last_name ?? '') + ': ' + (msg.text ?? ''));
                bot.sendMessage(msg.chat.id, "不允許私人刷，要刷麻煩自己novelai.net購買");
                return
            }
        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message);
            }
        }

        try {
            var body: string = msg.text!.replace('@' + botUsername, '').trim();
            console.log('Group: ' + (msg.chat.title ?? '') + ', user: ' + (msg.from?.first_name ?? '') + (msg.from?.last_name ?? '') + ': ' + (msg.text ?? ''));


            if (body.match(RegExp('^\/ping(\@' + botUsername + ')?'))) {
                bot.sendMessage(msg.chat.id, 'pong!');
                return;
            }

            if (body.match(RegExp('^\/nai(\@' + botUsername + ')?$'))) {
                bot.sendMessage(msg.chat.id, 'man nai');
                return;
            }


            if (body.match(RegExp('^\/nai (.+)'))) {
                var sendMsg = await bot.sendMessage(msg.chat.id, '等等', {
                    reply_to_message_id: msg.message_id
                });

                var argsRaw = body.substring('/nai '.length).trim().split('\n');
                var prompt: string = argsRaw.reverse().pop()!;

                var args: Map<string, string> = new Map();
                for (const argRaw of argsRaw) {
                    args.set(argRaw.split("=")[0].trim(), argRaw.split("=")[1].trim());
                }

                var helper = new NaiHelper(naiUser, prompt);
                await helper.fetch();

                bot.sendPhoto(msg.chat.id, Buffer.from(helper.images[0].imagesBase64!, 'base64'), {
                    reply_to_message_id: msg.message_id
                })
                bot.deleteMessage(sendMsg.chat.id, sendMsg.message_id.toString());
                return;
            }
        } catch (error) {

        }
        // bot.sendMessage(msg.chat.id, 'pong!');
    });
}

main();