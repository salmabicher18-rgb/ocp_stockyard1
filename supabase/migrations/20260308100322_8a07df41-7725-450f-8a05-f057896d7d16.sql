
-- Drop all restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Allow all on Couches" ON public."Couches";
DROP POLICY IF EXISTS "Allow all on Fractions" ON public."Fractions";
DROP POLICY IF EXISTS "Allow all on ImportHistory" ON public."ImportHistory";
DROP POLICY IF EXISTS "Allow all on Machines" ON public."Machines";
DROP POLICY IF EXISTS "Allow all on MatricesCible" ON public."MatricesCible";
DROP POLICY IF EXISTS "Allow all on TasBrut" ON public."TasBrut";
DROP POLICY IF EXISTS "Allow all on TasLave" ON public."TasLave";

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Allow all on Couches" ON public."Couches" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Fractions" ON public."Fractions" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ImportHistory" ON public."ImportHistory" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Machines" ON public."Machines" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on MatricesCible" ON public."MatricesCible" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on TasBrut" ON public."TasBrut" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on TasLave" ON public."TasLave" FOR ALL USING (true) WITH CHECK (true);
