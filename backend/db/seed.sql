-- Seed data: Default machines
INSERT INTO machines (nom_machine, type, ligne, position_m, statut) VALUES
  ('ST110', 'Stacker', 'Stock Brut', 150, 'Actif'),
  ('RP120', 'Roue-Pelle', 'Stock Brut', 100, 'Actif'),
  ('ST110', 'Stacker', 'Stock Lavé', 200, 'Actif'),
  ('RP120', 'Roue-Pelle', 'Stock Lavé', 60, 'Actif')
ON CONFLICT DO NOTHING;
