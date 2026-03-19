const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/machines
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM machines ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/machines
router.post('/', async (req, res) => {
  try {
    const { nom_machine, type, ligne, position_m, statut, tas_associe } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO machines (nom_machine, type, ligne, position_m, statut, tas_associe)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nom_machine, type, ligne, position_m, statut || 'Actif', tas_associe]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/machines/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ' });

    const sets = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map(k => fields[k]);

    const { rows } = await pool.query(
      `UPDATE machines SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Machine non trouvée' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/machines/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM machines WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Machine non trouvée' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
