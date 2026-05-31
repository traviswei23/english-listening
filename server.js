const express = require('express');
const { EdgeTTS } = require('node-edge-tts');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';  // Listen on all interfaces for cloud/LAN access

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure audio output directory exists
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

// Curated voice list for English listening tests
const VOICES = [
    { id: 'en-US-AriaNeural', name: 'Aria (美式女声)', description: '⭐ 推荐 - 清晰温暖，最接近中国听力考试老师音色', gender: 'Female', locale: 'en-US' },
    { id: 'en-US-JennyNeural', name: 'Jenny (美式女声)', description: '友好自然，适合初中听力', gender: 'Female', locale: 'en-US' },
    { id: 'en-US-GuyNeural', name: 'Guy (美式男声)', description: '⭐ 推荐 - 标准美式男声，中国考试常用音色', gender: 'Male', locale: 'en-US' },
    { id: 'en-US-DavisNeural', name: 'Davis (美式男声)', description: '沉稳男声，适合短文朗读', gender: 'Male', locale: 'en-US' },
    { id: 'en-US-JaneNeural', name: 'Jane (美式女声)', description: '亲切女声，适合对话练习', gender: 'Female', locale: 'en-US' },
    { id: 'en-US-NancyNeural', name: 'Nancy (美式女声)', description: '活泼女声，适合小学听力', gender: 'Female', locale: 'en-US' },
    { id: 'en-US-TonyNeural', name: 'Tony (美式男声)', description: '温暖男声，适合故事朗读', gender: 'Male', locale: 'en-US' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (英式女声)', description: '⭐ 推荐 - 标准英式发音，清晰优雅', gender: 'Female', locale: 'en-GB' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (英式男声)', description: '英式男声，清晰稳重', gender: 'Male', locale: 'en-GB' },
    { id: 'en-GB-LibbyNeural', name: 'Libby (英式女声)', description: '温和英式女声', gender: 'Female', locale: 'en-GB' },
    { id: 'en-AU-NatashaNeural', name: 'Natasha (澳式女声)', description: '澳洲英语发音', gender: 'Female', locale: 'en-AU' },
    { id: 'en-AU-WilliamNeural', name: 'William (澳式男声)', description: '澳洲英语男声', gender: 'Male', locale: 'en-AU' }
];

// List voices endpoint
app.get('/api/voices', (req, res) => {
    res.json({ voices: VOICES });
});

// TTS endpoint - generates audio file
app.post('/api/tts', async (req, res) => {
    const { text, voice = 'en-US-AriaNeural', rate = 0 } = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: '请输入文本内容' });
    }

    if (text.length > 5000) {
        return res.status(400).json({ error: '文本长度不能超过5000字符' });
    }

    try {
        // Process text: add natural pauses between sentences
        const processedText = text
            .replace(/([.!?])\s*/g, '$1  ')     // Extra space after sentence endings
            .replace(/\n\n/g, '.  ')             // Double newlines → clear pause
            .replace(/\n/g, ', ')                // Single newlines → short pause
            .trim();

        // Cache key
        const hash = crypto.createHash('md5')
            .update(processedText + voice + String(rate))
            .digest('hex');
        const filename = `listening_${hash}.mp3`;
        const filepath = path.join(audioDir, filename);

        // Cache hit
        if (fs.existsSync(filepath)) {
            return res.json({
                success: true,
                audioUrl: `/audio/${filename}`,
                cached: true
            });
        }

        // Configure TTS with the selected voice and rate
        const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;

        const tts = new EdgeTTS({
            voice: voice,
            lang: voice.split('-').slice(0, 2).join('-'),
            outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
            saveSubtitles: false,
            rate: rateStr
        });

        // Generate MP3
        await tts.ttsPromise(processedText, filepath);

        // Clean up old audio files (keep last 100)
        cleanOldFiles(audioDir, 100);

        res.json({
            success: true,
            audioUrl: `/audio/${filename}`,
            cached: false
        });

    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({
            error: '语音生成失败，请稍后重试',
            details: error.message
        });
    }
});

// Dialogue TTS endpoint - merges multiple voices into a single MP3
app.post('/api/tts/dialogue', async (req, res) => {
    const { segments, rate = 0 } = req.body;
    // segments: [{text: "Hello", voice: "en-US-AriaNeural"}, {text: "Hi", voice: "en-US-GuyNeural"}, ...]

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
        return res.status(400).json({ error: '请提供对话段落' });
    }

    try {
        // Cache key from all segments
        const hash = crypto.createHash('md5')
            .update(JSON.stringify({ segments, rate }))
            .digest('hex');
        const filename = `dialogue_${hash}.mp3`;
        const filepath = path.join(audioDir, filename);

        // Cache hit
        if (fs.existsSync(filepath)) {
            return res.json({
                success: true,
                audioUrl: `/audio/${filename}`,
                cached: true
            });
        }

        const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;
        const tempFiles = [];

        // Generate each segment
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            if (!seg.text || !seg.text.trim()) continue;

            const tmpFile = path.join(audioDir, `_tmp_${hash}_${i}.mp3`);
            const tts = new EdgeTTS({
                voice: seg.voice || 'en-US-AriaNeural',
                lang: (seg.voice || 'en-US-AriaNeural').split('-').slice(0, 2).join('-'),
                outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
                saveSubtitles: false,
                rate: rateStr
            });

            await tts.ttsPromise(seg.text.trim(), tmpFile);
            tempFiles.push(tmpFile);
        }

        // Concatenate all MP3 files into one
        const outFd = fs.openSync(filepath, 'w');
        for (const tmp of tempFiles) {
            const data = fs.readFileSync(tmp);
            fs.writeSync(outFd, data);
            // Clean up temp file
            try { fs.unlinkSync(tmp); } catch (e) { /* ignore */ }
        }
        fs.closeSync(outFd);

        // Clean old files
        cleanOldFiles(audioDir, 100);

        res.json({
            success: true,
            audioUrl: `/audio/${filename}`,
            cached: false,
            segmentCount: tempFiles.length
        });

    } catch (error) {
        console.error('Dialogue TTS Error:', error);
        res.status(500).json({
            error: '对话语音生成失败，请稍后重试',
            details: error.message
        });
    }
});

// Clean old audio files to save disk space
function cleanOldFiles(dir, keepCount) {
    try {
        const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.mp3') && f.startsWith('listening_'))
            .map(f => ({
                name: f,
                time: fs.statSync(path.join(dir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (files.length > keepCount) {
            files.slice(keepCount).forEach(f => {
                try { fs.unlinkSync(path.join(dir, f.name)); } catch (e) { /* ignore */ }
            });
        }
    } catch (e) { /* ignore */ }
}

// Start server
app.listen(PORT, HOST, () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('  🎧  英语听力音频生成器');
    console.log('  English Listening TTS Generator');
    console.log('═══════════════════════════════════════════');
    console.log(`  📝 访问: http://localhost:${PORT}`);
    console.log('  🔊 Microsoft Neural TTS · 神经网络语音');
    console.log('  💡 提示: Ctrl+Enter 快速生成音频');
    console.log('═══════════════════════════════════════════');
    console.log('');
});
