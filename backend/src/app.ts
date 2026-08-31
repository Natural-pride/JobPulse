import express, { type Express } from 'express';
import cors from 'cors';
import type Database from 'better-sqlite3';
import { createOpportunitiesRouter } from './routes/opportunities.js';
import { createRoundsRouter } from './routes/rounds.js';

export function createApp(db: Database.Database): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/opportunities', createOpportunitiesRouter(db));
  app.use('/api', createRoundsRouter(db));
  return app;
}
