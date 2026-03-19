const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/matrices
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM matrices_cible ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/matrices
router.post('/', async (req, res) => {
  try {
    const { nom_matrice, type, BPL_min, BPL_max, CO2_min, CO2_max, SiO2_min, SiO2_max, MgO_min, MgO_max, Cd_min, Cd_max } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO matrices_cible (nom_matrice, type, "BPL_min", "BPL_max", "CO2_min", "CO2_max", "SiO2_min", "SiO2_max", "MgO_min", "MgO_max", "Cd_min", "Cd_max")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [nom_matrice, type, BPL_min, BPL_max, CO2_min, CO2_max, SiO2_min, SiO2_max, MgO_min, MgO_max, Cd_min, Cd_max]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/matrices/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'Aucun champ' });

    const sets = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map(k => fields[k]);

    const { rows } = await pool.query(
      `UPDATE matrices_cible SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Matrice non trouvée' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/matrices/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM matrices_cible WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Matrice non trouvée' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
