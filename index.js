const { Telegraf } = require('telegraf');
const axios = require('axios');

// التأكد من جلب التوكن بشكل صحيح
const token = process.env.BOT_TOKEN || '8438510662:AAFYklzB7mu8U6j0Wzby0YkuwJsgaY3DtJk';
const bot = new Telegraf(token);

// عند إرسال /start
bot.start((ctx) => {
    return ctx.reply("💥 أهلاً بك! البوت يعمل الآن بنجاح على سيرفر Vercel المحدث.\n\nقم بتحويل أو إرسال أي فيديو هنا مباشرة وسأعطيك رابط البث فوراً.");
});

// عند إرسال فيديو أو مستند
bot.on(['video', 'document'], async (ctx) => {
    const message = ctx.message || ctx.channelPost;
    if (!message) return;

    const video = message.video;
    const doc = message.document;
    const fileId = video ? video.file_id : doc.file_id;

    if (!fileId) return;

    try {
        const waitingMsg = await ctx.reply("⏳ جاري توليد رابط البث المباشر، يرجى الانتظار ثوانٍ...");
        
        // جلب رابط الملف من تلغرام
        const fileLink = await ctx.telegram.getFileLink(fileId);
        
        const host = ctx.headers?.host || 'novaxx994.vercel.app';
        const streamLink = `https://${host}/stream?file=${encodeURIComponent(fileLink.href)}`;
        
        // مسح رسالة الانتظار وإرسال الرابط النهائي
        await ctx.telegram.deleteMessage(ctx.chat.id, waitingMsg.message_id).catch(() => {});
        return ctx.reply(`✅ جاهز للمشاهدة المباشرة!\n\n🔗 رابط الفيلم المباشر:\n${streamLink}`);
    } catch (error) {
        console.error("Error inside bot execution:", error);
        return ctx.reply("❌ حدث خطأ أثناء معالجة الفيلم. تأكد من حجم الملف.");
    }
});

// الدالة الأساسية لـ Vercel
module.exports = async (req, res) => {
    try {
        const reqUrl = req.url || '';
        
        // 1. مسار البث المباشر (GET /stream)
        if (reqUrl.includes('/stream')) {
            // تفكيك الرابط يدويًا لتجنب أخطاء الـ URL Object في Vercel
            const fileParam = reqUrl.split('file=')[1];
            if (!fileParam) {
                return res.status(400).send('Missing file URL');
            }
            const fileUrl = decodeURIComponent(fileParam);

            const response = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });
            res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
            response.data.pipe(res);
            return;
        }

        // 2. استقبال تحديثات التلغرام (POST)
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

        // 3. الصفحة الرئيسية العادية
        res.status(200).send('Bot Server is Up and Running Perfectly!');
    } catch (error) {
        console.error("Server Error:", error);
        // منع السيرفر من الانهيار وإرجاع استجابة دائماً لتلغرام لكي لا يعلق البوت
        if (!res.writableEnded) {
            res.status(200).send('Handled Error');
        }
    }
};
        try {
            // تليغرام يرسل التحديثات في الـ req.body مباشرة داخل بيئة Vercel المحدثة
            const body = req.body;
            await bot.handleUpdate(body, res);
            if (!res.writableEnded) res.status(200).end();
        } catch (err) {
            console.error("Webhook Error:", err);
            res.status(500).send("Webhook Error");
        }
        return;
    }

    // معالجة طلبات البث المباشر (GET)
    const urlObj = new URL(req.url, `https://${req.headers.host}`);
    if (urlObj.pathname.startsWith('/stream')) {
        const fileUrl = urlObj.searchParams.get('file');
        if (!fileUrl) return res.status(400).send('Missing file URL');

        try {
            const response = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });
            res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
            response.data.pipe(res);
        } catch (err) {
            res.status(500).send('Streaming Error');
        }
        return;
    }

    // الصفحة الرئيسية الافتراضية
    res.status(200).send('Bot Server is Up and Running Perfectly!');
};
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch (e) { resolve({}); }
        });
        req.on('error', (err) => reject(err));
    });
}

// السيرفر الرئيسي لـ Vercel
module.exports = async (req, res) => {
    try {
        // معالجة تحديثات التليغرام (POST)
        if (req.method === 'POST') {
            // قراءة وتفكيك الـ Body يدوياً لضمان توافقه مع Vercel Serverless
            const body = await parseRequestBody(req);
            await bot.handleUpdate(body, res);
            if (!res.writableEnded) {
                res.status(200).end();
            }
            return;
        }

        const urlObj = new URL(req.url, `https://${req.headers.host}`);

        // مسار البث المباشر
        if (urlObj.pathname.startsWith('/stream')) {
            const fileUrl = urlObj.searchParams.get('file');
            if (!fileUrl) {
                return res.status(400).send('Missing file URL');
            }

            const response = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });
            res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
            response.data.pipe(res);
            return;
        }

        res.status(200).send('Bot Server is Ready and Alive!');
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).send('Internal Error');
    }
};
            await bot.handleUpdate(req.body, res);
            if (!res.writableEnded) {
                res.status(200).end();
            }
            return;
        }

        const urlObj = new URL(req.url, `https://${req.headers.host}`);

        // مسار البث المباشر للأفلام
        if (urlObj.pathname.startsWith('/stream')) {
            const fileUrl = urlObj.searchParams.get('file');
            if (!fileUrl) {
                return res.status(400).send('Missing file URL');
            }

            const response = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });
            res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
            response.data.pipe(res);
            return;
        }

        // الصفحة الرئيسية الافتراضية للموقع
        res.status(200).send('Bot Server is Ready and Alive!');
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).send('Internal Error');
    }
};
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
