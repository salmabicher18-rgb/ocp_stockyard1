const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// POST /api/couches — Add layer
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { tas_brut_id, tas_lave_id, tonnage, date, type, source, BPL, CO2, SiO2, MgO, Cd, H2O, fractions } = req.body;

    const { rows } = await client.query(
      `INSERT INTO couches (tas_brut_id, tas_lave_id, tonnage, date, type, source, "BPL", "CO2", "SiO2", "MgO", "Cd", "H2O")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [tas_brut_id, tas_lave_id, tonnage, date, type, source, BPL, CO2, SiO2, MgO, Cd, H2O]
    );

    const couche = rows[0];

    // Insert fractions if provided
    if (fractions && fractions.length > 0) {
      for (const f of fractions) {
        await client.query(
          `INSERT INTO fractions (couche_id, tamis, poids, "BPL", "CO2", "SiO2", "MgO", "Cd")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [couche.id, f.tamis, f.poids, f.BPL, f.CO2, f.SiO2, f.MgO, f.Cd]
        );
      }
    }

    // Update tonnage on parent
    if (tas_brut_id) {
      await client.query(
        `UPDATE tas_brut SET tonnage_thc = (SELECT COALESCE(SUM(tonnage), 0) FROM couches WHERE tas_brut_id = $1) WHERE id = $1`,
        [tas_brut_id]
      );
    }
    if (tas_lave_id) {
      await client.query(
        `UPDATE tas_lave SET tonnage_tsm = (SELECT COALESCE(SUM(tonnage), 0) FROM couches WHERE tas_lave_id = $1) WHERE id = $1`,
        [tas_lave_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(couche);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// PUT /api/couches/:id
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { tonnage, date, BPL, CO2, SiO2, MgO, Cd, H2O, fractions } = req.body;

    const { rows } = await client.query(
      `UPDATE couches SET tonnage=$1, date=$2, "BPL"=$3, "CO2"=$4, "SiO2"=$5, "MgO"=$6, "Cd"=$7, "H2O"=$8
       WHERE id = $9 RETURNING *`,
      [tonnage, date, BPL, CO2, SiO2, MgO, Cd, H2O, id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Couche non trouvée' });
    }

    const couche = rows[0];

    // Replace fractions if provided
    if (fractions && fractions.length > 0) {
      await client.query('DELETE FROM fractions WHERE couche_id = $1', [id]);
      for (const f of fractions) {
        await client.query(
          `INSERT INTO fractions (couche_id, tamis, poids, "BPL", "CO2", "SiO2", "MgO", "Cd")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, f.tamis, f.poids, f.BPL, f.CO2, f.SiO2, f.MgO, f.Cd]
        );
      }
    }

    // Update parent tonnage
    if (couche.tas_brut_id) {
      await client.query(
        `UPDATE tas_brut SET tonnage_thc = (SELECT COALESCE(SUM(tonnage), 0) FROM couches WHERE tas_brut_id = $1) WHERE id = $1`,
        [couche.tas_brut_id]
      );
    }
    if (couche.tas_lave_id) {
      await client.query(
        `UPDATE tas_lave SET tonnage_tsm = (SELECT COALESCE(SUM(tonnage), 0) FROM couches WHERE tas_lave_id = $1) WHERE id = $1`,
        [couche.tas_lave_id]
      );
    }

    await client.query('COMMIT');
    res.json(couche);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// DELETE /api/couches/:id
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // Get parent before delete
    const { rows } = await client.query('SELECT tas_brut_id, tas_lave_id FROM couches WHERE id = $1', [id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Couche non trouvée' });
    }

    const { tas_brut_id, tas_lave_id } = rows[0];

    // CASCADE handles fractions
    await client.query('DELETE FROM couches WHERE id = $1', [id]);

    // Update parent tonnage
    if (tas_brut_id) {
      await client.query(
        `UPDATE tas_brut SET tonnage_thc = (SELECT COALESCE(SUM(tonnage), 0) FROM couches WHERE tas_brut_id = $1) WHERE id = $1`,
        [tas_brut_id]
      );
    }
    if (tas_lave_id) {
      await client.query(
        `UPDATE tas_lave SET tonnage_tsm = (SELECT COALESCE(SUM(tonnage), 0) FROM couches WHERE tas_lave_id = $1) WHERE id = $1`,
        [tas_lave_id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

module.exports = router;
