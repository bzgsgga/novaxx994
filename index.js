const { Telegraf } = require('telegraf');
const axios = require('axios');

const token = '8438510662:AAFYklzB7mu8U6j0Wzby0YkuwJsgaY3DtJk';
const bot = new Telegraf(token);

bot.start((ctx) => {
    return ctx.reply("💥 أهلاً بك! البوت يعمل الآن بنجاح.\n\nقم بتحويل أو إرسال أي فيديو هنا مباشرة وسأعطيك رابط البث فوراً.");
});

bot.on(['video', 'document'], async (ctx) => {
    const message = ctx.message || ctx.channelPost;
    if (!message) return;

    const video = message.video;
    const doc = message.document;
    const fileId = video ? video.file_id : doc.file_id;

    if (!fileId) return;

    try {
        const waitingMsg = await ctx.reply("⏳ جاري توليد رابط البث المباشر...");
        const fileLink = await ctx.telegram.getFileLink(fileId);
        
        const host = ctx.headers?.host || 'novaxx994.vercel.app';
        const streamLink = `https://${host}/stream?file=${encodeURIComponent(fileLink.href)}`;
        
        await ctx.telegram.deleteMessage(ctx.chat.id, waitingMsg.message_id).catch(() => {});
        return ctx.reply(`✅ جاهز للمشاهدة المباشرة!\n\n🔗 رابط الفيلم المباشر:\n${streamLink}`);
    } catch (error) {
        console.error("Bot Error:", error);
        return ctx.reply("❌ حدث خطأ أثناء معالجة الفيلم.");
    }
});

module.exports = async (req, res) => {
    try {
        const reqUrl = req.url || '';

        // 1. مسار البث المباشر المحسن (GET /stream)
        if (reqUrl.includes('/stream')) {
            const fileParam = reqUrl.split('file=')[1];
            if (!fileParam) {
                return res.status(400).send('Missing file URL');
            }
            const fileUrl = decodeURIComponent(fileParam);

            const response = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });
            
            // إجبار المتصفح على تشغيل الفيديو مدمجاً (inline) بدلاً من تحميله (attachment)
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', 'inline');
            
            response.data.pipe(res);
            return;
        }

        if (req.method === 'POST') {
            const body = req.body;
            if (body && Object.keys(body).length > 0) {
                await bot.handleUpdate(body, res);
            }
            if (!res.writableEnded) {
                res.status(200).end();
            }
            return;
        }

        res.status(200).send('Bot Server is Up and Running Perfectly!');
    } catch (error) {
        console.error("Server Error:", error);
        if (!res.writableEnded) {
            res.status(200).send('Handled Error');
        }
    }
};
