const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/tas-lave
router.get('/', async (req, res) => {
  try {
    const { rows: piles } = await pool.query('SELECT * FROM tas_lave ORDER BY id');
    const { rows: couches } = await pool.query('SELECT * FROM couches WHERE tas_lave_id IS NOT NULL ORDER BY id');

    const result = piles.map(tas => ({
      ...tas,
      couches: couches.filter(c => c.tas_lave_id === tas.id),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/tas-lave
router.post('/', async (req, res) => {
  try {
    const { nom_tas, debut_m, fin_m, tonnage_tsm, source_name, source_id, statut } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO tas_lave (nom_tas, debut_m, fin_m, tonnage_tsm, source_name, source_id, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nom_tas, debut_m, fin_m, tonnage_tsm || 0, source_name, source_id, statut || 'en_cours']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/tas-lave/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

    const sets = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map(k => fields[k]);

    const { rows } = await pool.query(
      `UPDATE tas_lave SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Tas non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/tas-lave/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM tas_lave WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Tas non trouvé' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
