// هذا لتحوليه صيغ الفيديو إلا mp4 
// utils/videoConvert.js
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

/**
 * يحوّل أي فيديو (MOV, WebM...) إلى MP4 (H.264/AAC) باستخدام ffmpeg.
 * @param {Buffer} buffer - محتوى الفيديو (بصيغة ما) في الذاكرة
 * @returns {Promise<Buffer>} - يعيد محتوى ملف MP4 كـ Buffer
 */
async function convertMovToMp4(buffer) {
  return new Promise((resolve, reject) => {
    // 1) إعداد مسار مؤقت للملف الأصلي
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // نسمي ملف الإدخال "inputvid" دون امتداد ليدع ffmpeg يكتشف الصيغة
    const inputPath = path.join(tempDir, 'inputvid');
    fs.writeFileSync(inputPath, buffer);

    // ملف الإخراج بصيغة MP4
    const outputPath = path.join(tempDir, 'output.mp4');

    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')  // لضمان ترميز الفيديو في H.264
      .audioCodec('aac')      // لضمان ترميز الصوت في AAC
      .on('end', () => {
        // عند الانتهاء، نقرأ ملف output.mp4 إلى Buffer
        const mp4Buffer = fs.readFileSync(outputPath);

        // نحذف الملفات المؤقتة
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        resolve(mp4Buffer);
      })
      .on('error', (err) => {
        // في حال وقوع خطأ، نحذف الملفات المؤقتة إن وجدت
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        reject(err);
      })
      .run();
  });
}

module.exports = { convertMovToMp4 };
