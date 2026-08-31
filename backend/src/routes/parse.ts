import { Router } from 'express';
import multer from 'multer';
import { parseInterviewScreenshot, type ParsedInterview } from '../lib/zhipu.js';

export interface ParseResponse {
  parsed: ParsedInterview;
  /** Echo of what was sent, for debugging / future caching. */
  meta: {
    bytes: number;
    mime: string;
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('只支持图片文件（PNG / JPG / WebP）'));
      return;
    }
    cb(null, true);
  },
});

export function createParseRouter(): Router {
  const router = Router();

  router.post('/parse-screenshot', upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }
    try {
      const base64 = req.file.buffer.toString('base64');
      const parsed = await parseInterviewScreenshot(base64, req.file.mimetype);
      // No persistence: the image buffer is discarded after this request.
      const body: ParseResponse = {
        parsed,
        meta: { bytes: req.file.size, mime: req.file.mimetype },
      };
      res.json(body);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '解析失败';
      // Map common auth / network issues to a friendlier 4xx so the UI can show a helpful toast.
      const status = msg.includes('ZHIPU_API_KEY') ? 503 : 502;
      res.status(status).json({ error: msg });
    }
  });

  return router;
}
