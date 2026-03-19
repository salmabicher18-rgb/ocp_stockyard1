const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/tas-brut — List all with layers and fractions
router.get('/', async (req, res) => {
  try {
    const { rows: piles } = await pool.query('SELECT * FROM tas_brut ORDER BY id');
    const { rows: couches } = await pool.query('SELECT * FROM couches WHERE tas_brut_id IS NOT NULL ORDER BY id');
    const coucheIds = couches.map(c => c.id);

    let fractions = [];
    if (coucheIds.length > 0) {
      const { rows } = await pool.query('SELECT * FROM fractions WHERE couche_id = ANY($1) ORDER BY id', [coucheIds]);
      fractions = rows;
    }

    const result = piles.map(tas => ({
      ...tas,
      couches: couches
        .filter(c => c.tas_brut_id === tas.id)
        .map(c => ({
          ...c,
          fractions: fractions.filter(f => f.couche_id === c.id),
        })),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/tas-brut
router.post('/', async (req, res) => {
  try {
    const { nom_tas, debut_m, fin_m, tonnage_thc, mode_stockage, statut } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO tas_brut (nom_tas, debut_m, fin_m, tonnage_thc, mode_stockage, statut)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nom_tas, debut_m, fin_m, tonnage_thc || 0, mode_stockage || 'chevron', statut || 'en_cours']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/tas-brut/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

    const sets = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map(k => fields[k]);

    const { rows } = await pool.query(
      `UPDATE tas_brut SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Tas non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/tas-brut/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Cascade handled by FK ON DELETE CASCADE
    const { rowCount } = await pool.query('DELETE FROM tas_brut WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Tas non trouvé' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
