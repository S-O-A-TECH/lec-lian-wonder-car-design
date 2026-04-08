import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/designs?sort=latest|popular&page=1&limit=20
router.get('/', (req, res) => {
  const { sort = 'latest', page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const orderBy = sort === 'popular' ? 'likes_count DESC' : 'created_at DESC';

  const designs = db.prepare(
    `SELECT id, nickname, title, brand, base_model, thumbnail, likes_count, created_at
     FROM designs ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).all(Number(limit), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM designs').get().count;

  res.json({ designs, total, page: Number(page), limit: Number(limit) });
});

// GET /api/designs/:id
router.get('/:id', (req, res) => {
  const design = db.prepare('SELECT * FROM designs WHERE id = ?').get(req.params.id);
  if (!design) return res.status(404).json({ error: 'Design not found' });
  design.parts_config = JSON.parse(design.parts_config);
  res.json(design);
});

// POST /api/designs
router.post('/', (req, res) => {
  const { nickname, title, brand, base_model, parts_config, thumbnail } = req.body;

  if (!nickname || !title || !brand || !base_model || !parts_config || !thumbnail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = db.prepare(
    `INSERT INTO designs (nickname, title, brand, base_model, parts_config, thumbnail)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(nickname, title, brand, base_model, JSON.stringify(parts_config), thumbnail);

  res.status(201).json({ id: result.lastInsertRowid });
});

// POST /api/designs/:id/like
router.post('/:id/like', (req, res) => {
  const { nickname } = req.body;
  if (!nickname) return res.status(400).json({ error: 'Nickname required' });

  const designId = Number(req.params.id);
  const existing = db.prepare(
    'SELECT id FROM likes WHERE design_id = ? AND nickname = ?'
  ).get(designId, nickname);

  if (existing) {
    db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
    db.prepare('UPDATE designs SET likes_count = likes_count - 1 WHERE id = ?').run(designId);
    const design = db.prepare('SELECT likes_count FROM designs WHERE id = ?').get(designId);
    res.json({ liked: false, likes_count: design.likes_count });
  } else {
    db.prepare('INSERT INTO likes (design_id, nickname) VALUES (?, ?)').run(designId, nickname);
    db.prepare('UPDATE designs SET likes_count = likes_count + 1 WHERE id = ?').run(designId);
    const design = db.prepare('SELECT likes_count FROM designs WHERE id = ?').get(designId);
    res.json({ liked: true, likes_count: design.likes_count });
  }
});

export default router;
