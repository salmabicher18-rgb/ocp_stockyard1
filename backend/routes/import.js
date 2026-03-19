const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// POST /api/import/brut — Sync raw stockpiles (upsert + delete orphan layers)
router.post('/brut', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { piles } = req.body;
    let tasCreated = 0, tasUpdated = 0, layersAdded = 0, layersUpdated = 0;

    for (const pile of piles) {
      // Upsert tas
      const { rows: existing } = await client.query('SELECT id FROM tas_brut WHERE nom_tas = $1', [pile.nom_tas]);

      let tasId;
      if (existing.length > 0) {
        tasId = existing[0].id;
        await client.query(
          `UPDATE tas_brut SET debut_m=$1, fin_m=$2, mode_stockage=$3, statut=$4 WHERE id=$5`,
          [pile.debut_m, pile.fin_m, pile.mode_stockage, pile.statut, tasId]
        );
        tasUpdated++;
      } else {
        const { rows } = await client.query(
          `INSERT INTO tas_brut (nom_tas, debut_m, fin_m, mode_stockage, statut) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [pile.nom_tas, pile.debut_m, pile.fin_m, pile.mode_stockage, pile.statut]
        );
        tasId = rows[0].id;
        tasCreated++;
      }

      // Get existing layers for this tas
      const { rows: existingLayers } = await client.query(
        'SELECT id, source FROM couches WHERE tas_brut_id = $1', [tasId]
      );
      const existingLayerMap = new Map(existingLayers.map(l => [l.source, l.id]));

      // Track which layer sources are in the parsed data
      const parsedSources = new Set();

      for (const layer of (pile.layers || [])) {
        const source = `layer-${layer.layerIdx}`;
        parsedSources.add(source);
        const existingCoucheId = existingLayerMap.get(source);

        const firstFrac = (layer.fractions || [])[0];
        const layerData = {
          tonnage: layer.tonnage,
          date: layer.date,
          type: 'brut',
          source: source,
          H2O: layer.h2o,
          BPL: firstFrac ? firstFrac.BPL : null,
          CO2: firstFrac ? firstFrac.CO2 : null,
          SiO2: firstFrac ? firstFrac.SiO2 : null,
          MgO: firstFrac ? firstFrac.MgO : null,
          Cd: firstFrac ? firstFrac.Cd : null,
        };

        let coucheId;
        if (existingCoucheId) {
          // Update existing layer
          await client.query(
            `UPDATE couches SET tonnage=$1, date=$2, "H2O"=$3, "BPL"=$4, "CO2"=$5, "SiO2"=$6, "MgO"=$7, "Cd"=$8 WHERE id=$9`,
            [layerData.tonnage, layerData.date, layerData.H2O, layerData.BPL, layerData.CO2, layerData.SiO2, layerData.MgO, layerData.Cd, existingCoucheId]
          );
          coucheId = existingCoucheId;
          layersUpdated++;

          // Delete old fractions and re-insert
          await client.query('DELETE FROM fractions WHERE couche_id = $1', [coucheId]);
        } else {
          // Insert new layer
          const { rows: lRows } = await client.query(
            `INSERT INTO couches (tas_brut_id, tonnage, date, type, source, "BPL", "CO2", "SiO2", "MgO", "Cd", "H2O")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
            [tasId, layerData.tonnage, layerData.date, layerData.type, layerData.source, layerData.BPL, layerData.CO2, layerData.SiO2, layerData.MgO, layerData.Cd, layerData.H2O]
          );
          coucheId = lRows[0].id;
          layersAdded++;
        }

        // Insert fractions
        for (const f of (layer.fractions || [])) {
          await client.query(
            `INSERT INTO fractions (couche_id, tamis, poids, "BPL", "CO2", "SiO2", "MgO", "Cd")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [coucheId, f.tamis, f.poids, f.BPL, f.CO2, f.SiO2, f.MgO, f.Cd]
          );
        }
      }

      // Delete orphan layers (exist in DB but not in Excel)
      for (const [source, coucheId] of existingLayerMap.entries()) {
        if (!parsedSources.has(source)) {
          await client.query('DELETE FROM fractions WHERE couche_id = $1', [coucheId]);
          await client.query('DELETE FROM couches WHERE id = $1', [coucheId]);
        }
      }

      // Update tonnage
      await client.query(
        `UPDATE tas_brut SET tonnage_thc = (SELECT COALESCE(SUM(tonnage),0) FROM couches WHERE tas_brut_id = $1) WHERE id = $1`,
        [tasId]
      );
    }

    await client.query('COMMIT');
    res.json({ tasCreated, tasUpdated, layersAdded, layersUpdated });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/import/lave — Sync washed stockpiles
router.post('/lave', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { piles } = req.body;
    let tasCreated = 0, tasUpdated = 0, layersAdded = 0, layersUpdated = 0;

    // Resolve source IDs from tas_brut
    const sourceNames = [...new Set(piles.map(p => p.source_name).filter(Boolean))];
    const sourceMap = new Map();
    if (sourceNames.length > 0) {
      const placeholders = sourceNames.map((_, i) => `$${i + 1}`).join(',');
      const { rows: sources } = await client.query(
        `SELECT id, nom_tas FROM tas_brut WHERE nom_tas IN (${placeholders})`, sourceNames
      );
      sources.forEach(s => sourceMap.set(s.nom_tas, s.id));
    }

    for (const pile of piles) {
      const { rows: existing } = await client.query('SELECT id FROM tas_lave WHERE nom_tas = $1', [pile.nom_tas]);

      let tasId;
      const sourceId = pile.source_name ? sourceMap.get(pile.source_name) || null : null;

      if (existing.length > 0) {
        tasId = existing[0].id;
        await client.query(
          `UPDATE tas_lave SET debut_m=$1, fin_m=$2, source_name=$3, source_id=$4, statut=$5 WHERE id=$6`,
          [pile.debut_m, pile.fin_m, pile.source_name, sourceId, pile.statut, tasId]
        );
        tasUpdated++;
      } else {
        const { rows } = await client.query(
          `INSERT INTO tas_lave (nom_tas, debut_m, fin_m, source_name, source_id, statut) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [pile.nom_tas, pile.debut_m, pile.fin_m, pile.source_name, sourceId, pile.statut]
        );
        tasId = rows[0].id;
        tasCreated++;
      }

      // Get existing layers
      const { rows: existingLayers } = await client.query(
        'SELECT id, source FROM couches WHERE tas_lave_id = $1', [tasId]
      );
      const existingLayerMap = new Map(existingLayers.map(l => [l.source, l.id]));
      const parsedSources = new Set();

      for (const layer of (pile.layers || [])) {
        const source = `layer-${layer.layerIdx}`;
        parsedSources.add(source);
        const existingCoucheId = existingLayerMap.get(source);

        if (existingCoucheId) {
          await client.query(
            `UPDATE couches SET tonnage=$1, date=$2, "BPL"=$3, "CO2"=$4, "SiO2"=$5, "MgO"=$6, "Cd"=$7, "H2O"=$8 WHERE id=$9`,
            [layer.tonnage, layer.date, layer.BPL, layer.CO2, layer.SiO2, layer.MgO, layer.Cd, layer.H2O, existingCoucheId]
          );
          layersUpdated++;
        } else {
          await client.query(
            `INSERT INTO couches (tas_lave_id, tonnage, date, type, source, "BPL", "CO2", "SiO2", "MgO", "Cd", "H2O")
             VALUES ($1,$2,$3,'lave',$4,$5,$6,$7,$8,$9,$10)`,
            [tasId, layer.tonnage, layer.date, source, layer.BPL, layer.CO2, layer.SiO2, layer.MgO, layer.Cd, layer.H2O]
          );
          layersAdded++;
        }
      }

      // Delete orphan layers
      for (const [source, coucheId] of existingLayerMap.entries()) {
        if (!parsedSources.has(source)) {
          await client.query('DELETE FROM couches WHERE id = $1', [coucheId]);
        }
      }

      // Update tonnage
      await client.query(
        `UPDATE tas_lave SET tonnage_tsm = (SELECT COALESCE(SUM(tonnage),0) FROM couches WHERE tas_lave_id = $1) WHERE id = $1`,
        [tasId]
      );
    }

    await client.query('COMMIT');
    res.json({ tasCreated, tasUpdated, layersAdded, layersUpdated });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/import/machines — Update existing machines by name+ligne
router.post('/machines', async (req, res) => {
  try {
    const { machines } = req.body;
    let machinesUpdated = 0;

    // Get existing machines
    const { rows: existing } = await pool.query('SELECT id, nom_machine, ligne FROM machines ORDER BY id');
    const existingMap = new Map(existing.map(m => [`${m.nom_machine}__${m.ligne}`, m.id]));

    for (const m of machines) {
      const key = `${m.nom_machine}__${m.ligne}`;
      const dbId = existingMap.get(key);
      if (dbId) {
        const updates = [];
        const values = [];
        let idx = 1;
        if (m.position_m !== undefined) { updates.push(`position_m=$${idx++}`); values.push(m.position_m); }
        if (m.statut !== undefined) { updates.push(`statut=$${idx++}`); values.push(m.statut); }
        if (updates.length > 0) {
          values.push(dbId);
          await pool.query(`UPDATE machines SET ${updates.join(',')} WHERE id=$${idx}`, values);
          machinesUpdated++;
        }
      }
    }
    res.json({ machinesUpdated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/import/log
router.post('/log', async (req, res) => {
  try {
    const { file_name, raw_count, washed_count, machine_count, layer_count, errors } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO import_history (file_name, raw_count, washed_count, machine_count, layer_count, errors)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [file_name, raw_count || 0, washed_count || 0, machine_count || 0, layer_count || 0, errors || []]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/import/history
router.get('/history', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM import_history ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
