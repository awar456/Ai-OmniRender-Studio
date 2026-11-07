import express from 'express';
import { apiRouter } from './api';

export const app = express();

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

app.use('/api', apiRouter);
