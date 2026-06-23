const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

// معالجة أي فيديو أو ملف يتم رفعه داخل الجروب أو القناة المشترك بها البوت
bot.on(['video', 'document'], async (ctx) => {
    // التأكد من وجود ملف فيديو أو مستند
    const message = ctx.message || ctx.channelPost;
    if (!message) return;

    const video = message.video;
    const doc = message.document;
    
    if (video || doc) {
        const fileId = video ? video.file_id : doc.file_id;
        
        try {
            // جلب رابط الملف المباشر من سيرفرات التليغرام
            const fileLink = await ctx.telegram.getFileLink(fileId);
            
            // بناء رابط البث المعتمد على سيرفر Vercel الخاص بك
            const domain = process.env.VERCEL_URL || 'your-project.vercel.app';
            const streamLink = `https://${domain}/stream?file=${encodeURIComponent(fileLink.href)}`;
            
            // البوت يرسل رد تلقائي داخل الجروب بالرابط الجديد للفيلم
            ctx.reply(`✅ تم تجهيز رابط البث للفيلم بنجاح!\n\n🔗 رابط المشاهدة المباشر:\n${streamLink}`, {
                reply_to_message_id: message.message_id
            });
        } catch (error) {
            console.error("Error generating stream link:", error);
        }
    }
});

// محرك البث (Streaming Engine) لتمرير الفيديو للمتصفح
const server = http.createServer(async (req, res) => {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    
    if (urlObj.pathname === '/stream') {
        const fileUrl = urlObj.searchParams.get('file');
        if (!fileUrl) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end('Missing file URL');
        }

        try {
            const response = await axios({
                method: 'get',
                url: fileUrl,
                responseType: 'stream'
            });

            res.writeHead(200, {
                'Content-Type': response.headers['content-type'] || 'video/mp4',
                'Content-Length': response.headers['content-length'],
                'Accept-Ranges': 'bytes'
            });

            response.data.pipe(res);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error streaming file');
        }
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Server is running healthy!');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    bot.launch().catch(err => console.error('Bot launch error:', err));
    console.log(`Server listening on port ${PORT}`);
});
