const { Telegraf } = require('telegraf');
const axios = require('axios');

// التأكد من جلب التوكن
const bot = new Telegraf(process.env.BOT_TOKEN);

// دالة توليد الرابط عند استلام فيديو أو مستند
bot.on(['video', 'document'], async (ctx) => {
    const message = ctx.message || ctx.channelPost;
    if (!message) return;

    const video = message.video;
    const doc = message.document;
    
    if (video || doc) {
        const fileId = video ? video.file_id : doc.file_id;
        
        try {
            // جلب رابط الملف من سيرفرات التليغرام
            const fileLink = await ctx.telegram.getFileLink(fileId);
            
            // جلب رابط الدومين الخاص بك على Vercel تلقائياً
            const host = ctx.headers?.host || process.env.VERCEL_URL || 'your-domain.vercel.app';
            const streamLink = `https://${host}/api/stream?file=${encodeURIComponent(fileLink.href)}`;
            
            // إرسال الرد داخل الجروب
            await ctx.reply(`✅ تم تجهيز رابط البث للفيلم بنجاح!\n\n🔗 رابط المشاهدة المباشر:\n${streamLink}`, {
                reply_to_message_id: message.message_id
            });
        } catch (error) {
            console.error("Error:", error);
        }
    }
});

// تصدير الدالة لتشغيلها كـ Serverless Function على Vercel
module.exports = async (req, res) => {
    try {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);

        // 1. مسار البث المباشر
        if (urlObj.pathname.includes('/api/stream')) {
            const fileUrl = urlObj.searchParams.get('file');
            if (!fileUrl) {
                res.status(400).send('Missing file URL');
                return;
            }

            const response = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });
            res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
            response.data.pipe(res);
            return;
        }

        // 2. مسار استقبال تحديثات التليغرام (Webhook)
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body, res);
            if (!res.writableEnded) res.status(200).end();
            return;
        }

        res.status(200).send('Streaming Server is Ready!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Error');
    }
};
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
