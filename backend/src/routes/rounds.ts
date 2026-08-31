import { Router } from 'express';
import type Database from 'better-sqlite3';

export function createRoundsRouter(_db: Database.Database): Router {
  const router = Router();
  return router;
}
