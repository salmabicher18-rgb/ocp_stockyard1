
-- Delete duplicate machines, keep only ids 1-4
DELETE FROM public."Machines" WHERE id > 4;

-- Update the 4 fixed machines with correct data
UPDATE public."Machines" SET nom_machine = 'ST110', type = 'Stacker', ligne = 'Stock Brut', position_m = 0, statut = 'Actif' WHERE id = 4;
UPDATE public."Machines" SET nom_machine = 'RP120', type = 'Roue-Pelle', ligne = 'Stock Brut', position_m = 378, statut = 'Actif' WHERE id = 3;
UPDATE public."Machines" SET nom_machine = 'RP120', type = 'Roue-Pelle', ligne = 'Stock Lavé', position_m = 0, statut = 'Actif' WHERE id = 2;
UPDATE public."Machines" SET nom_machine = 'ST110', type = 'Stacker', ligne = 'Stock Lavé', position_m = 45, statut = 'Actif' WHERE id = 1;

-- Add unique constraint to prevent duplicates: one machine per name+ligne combo
ALTER TABLE public."Machines" ADD CONSTRAINT machines_unique_name_ligne UNIQUE (nom_machine, ligne);
