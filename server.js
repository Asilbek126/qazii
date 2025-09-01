const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public'))); // public papkada f1.js bo'lishi kerak

// 🔐 Telegram bot konfiguratsiyasi
const token = '8071464506:AAFd_ikwjijuCVuimaK0CD0pF2-dGM4lmlY';
const chatId = '5728779626';

let lastUpdateId = 0;

// 📨 So'nggi Telegram xabarini olish
app.get('/latest', async (req, res) => {
  try {
    const { data } = await axios.get(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}`);
    if (data.ok && data.result.length > 0) {
      let newText = null;
      data.result.forEach(update => {
        if (update.message && update.message.text) {
          lastUpdateId = update.update_id;
          newText = update.message.text;
        }
      });
      return res.json({ success: true, message: newText, update_id: lastUpdateId });
    }
    res.json({ success: false, message: null });
  } catch (err) {
    console.error('❌ Telegramdan xabar olishda xatolik:', err.message);
    res.status(500).json({ success: false });
  }
});

// 🧠 Frontend JS (f1.js) faylni berish
app.get('/f1.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'f1.js'));
});

// 🌐 HTML sahifani Telegramga yuborish
app.post('/upload-html', async (req, res) => {
  const html = req.body.html;
  if (!html) return res.status(400).json({ success: false, error: 'Bo‘sh HTML' });

  const filePath = path.join(__dirname, 'page.html');
  fs.writeFileSync(filePath, html);

  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('document', fs.createReadStream(filePath), 'page.html');

  try {
    const tgRes = await axios.post(`https://api.telegram.org/bot${token}/sendDocument`, form, {
      headers: form.getHeaders()
    });
    res.json({ success: true, result: tgRes.data });
  } catch (err) {
    console.error('❌ HTML yuborishda xatolik:', err.message);
    res.status(500).json({ success: false });
  }
});

// 🚀 Serverni ishga tushurish
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server ishlayapti: http://localhost:${PORT}`);
});
