const express = require('express');
const bodyParser = require('body-parser');
const ytdl = require('ytdl-core');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Serve the HTML file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/download', async (req, res) => {
    const { url, format } = req.body;
    if (!url || !ytdl.validateURL(url)) {
        return res.json({ success: false, message: 'Invalid URL' });
    }

    try {
        const videoInfo = await ytdl.getInfo(url);
        const videoTitle = videoInfo.videoDetails.title;
        const outputPath = path.join(__dirname, `${videoTitle}.${format}`);

        const stream = ytdl(url, { format: 'mp4' });

        ffmpeg(stream)
            .toFormat(format)
            .on('end', () => {
                res.download(outputPath, `${videoTitle}.${format}`, (err) => {
                    if (err) {
                        console.error('Download error:', err);
                    }
                    fs.unlink(outputPath, (err) => {
                        if (err) console.error('File deletion error:', err);
                    });
                });
            })
            .on('error', (err) => {
                console.error('Conversion error:', err);
                res.json({ success: false, message: 'Failed to convert video' });
            })
            .save(outputPath);

    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: 'Failed to download video' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
