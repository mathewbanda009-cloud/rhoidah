const { Router } = require('express');
const { parseId, validateRecord } = require('../validation');

module.exports = function recordsRouter(database) {
  const router = Router();
  const columns = 'id, title, category, description, status';

  router.get('/', async (req, res, next) => {
    try {
      const result = await database.execute(`SELECT ${columns} FROM records ORDER BY id`);
      res.status(200).json(result.rows);
    } catch (error) { next(error); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const result = await database.execute(`SELECT ${columns} FROM records WHERE id = ?`, [parseId(req.params.id)]);
      if (!result.rows.length) return res.status(404).json({ message: 'Record not found.' });
      res.status(200).json(result.rows[0]);
    } catch (error) { next(error); }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { title, category, description, status } = validateRecord(req.body);
      const result = await database.execute(
        `INSERT INTO records (title, category, description, status) VALUES (?, ?, ?, ?) RETURNING ${columns}`,
        [title, category, description, status],
      );
      res.status(201).json(result.rows[0]);
    } catch (error) { next(error); }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      const { title, category, description, status } = validateRecord(req.body);
      const result = await database.execute(
        `UPDATE records SET title = ?, category = ?, description = ?, status = ? WHERE id = ? RETURNING ${columns}`,
        [title, category, description, status, id],
      );
      if (!result.rows.length) return res.status(404).json({ message: 'Record not found.' });
      res.status(200).json(result.rows[0]);
    } catch (error) { next(error); }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const result = await database.execute('DELETE FROM records WHERE id = ? RETURNING id', [parseId(req.params.id)]);
      if (!result.rows.length) return res.status(404).json({ message: 'Record not found.' });
      res.status(200).json({ message: 'Record deleted.' });
    } catch (error) { next(error); }
  });

  return router;
};
