import { createApp } from './app.js';
import { getDb } from './db.js';

const PORT = Number(process.env.PORT) || 3001;

const db = getDb();
const app = createApp(db);

app.listen(PORT, () => {
  console.log(`JobPulse backend listening on http://localhost:${PORT}`);
});
