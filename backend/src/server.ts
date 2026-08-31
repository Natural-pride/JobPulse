import { createApp } from './app.js';
import { getDb } from './db.js';

const PORT = Number(process.env.PORT) || 3001;

const db = getDb();
const app = createApp(db);

if (!process.env.ZHIPU_API_KEY) {
  console.warn(
    '[JobPulse] ZHIPU_API_KEY is not set. The screenshot import endpoint (POST /api/parse-screenshot) will return 503 until you provide one.'
  );
}

app.listen(PORT, () => {
  console.log(`JobPulse backend listening on http://localhost:${PORT}`);
});
