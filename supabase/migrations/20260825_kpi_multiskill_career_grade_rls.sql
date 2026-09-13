-- Migration: 20260825_kpi_multiskill_career_grade_rls.sql
-- Goal: Fail-closed RLS policies cho bảng skills, grades, và employee skill certifications

-- 1. Bật RLS cho các bảng mới
ALTER TABLE public.kpi_operational_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_career_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_employee_skill_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Placements modify policy" ON public.kpi_career_employee_placements;
CREATE POLICY "Placements modify policy"
  ON public.kpi_career_employee_placements
  FOR ALL
  USING (public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin())
  WITH CHECK (public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin());

-- 2. Policies cho kpi_operational_skills
DROP POLICY IF EXISTS "Operational skills read policy" ON public.kpi_operational_skills;
CREATE POLICY "Operational skills read policy"
ON public.kpi_operational_skills
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Operational skills modify policy" ON public.kpi_operational_skills;
CREATE POLICY "Operational skills modify policy"
ON public.kpi_operational_skills
FOR ALL
TO authenticated
USING (public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin())
WITH CHECK (public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin());

-- 3. Policies cho kpi_career_grades
DROP POLICY IF EXISTS "Career grades read policy" ON public.kpi_career_grades;
CREATE POLICY "Career grades read policy"
ON public.kpi_career_grades
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Career grades modify policy" ON public.kpi_career_grades;
CREATE POLICY "Career grades modify policy"
ON public.kpi_career_grades
FOR ALL
TO authenticated
USING (public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin())
WITH CHECK (public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin());

-- 4. Policies cho kpi_employee_skill_certifications
DROP POLICY IF EXISTS "Certifications read policy" ON public.kpi_employee_skill_certifications;
CREATE POLICY "Certifications read policy"
ON public.kpi_employee_skill_certifications
FOR SELECT
TO authenticated
USING (
  -- Nhân viên tự xem chứng nhận của mình
  employee_id = public.app_kpi_current_employee_id()
  OR
  -- Trụ sở xem toàn chuỗi; quản lý cửa hàng chỉ xem nhân viên cùng cửa hàng.
  public.app_kpi_current_role() IN ('ceo', 'hr_admin', 'area_manager')
  OR
  EXISTS (
    SELECT 1 FROM public.nhan_vien viewer
    JOIN public.nhan_vien subject ON subject.id = kpi_employee_skill_certifications.employee_id
    WHERE viewer.id = public.app_kpi_current_employee_id()
      AND public.app_kpi_current_role() = 'store_manager'
      AND viewer.cua_hang_id IS NOT NULL
      AND viewer.cua_hang_id = subject.cua_hang_id
  )
);

DROP POLICY IF EXISTS "Certifications modify policy" ON public.kpi_employee_skill_certifications;
CREATE POLICY "Certifications modify policy"
ON public.kpi_employee_skill_certifications
FOR ALL
TO authenticated
USING (
  public.app_kpi_current_role() IN ('ceo', 'hr_admin')
  OR
  EXISTS (
    SELECT 1 FROM public.nhan_vien actor
    JOIN public.nhan_vien subject ON subject.id = kpi_employee_skill_certifications.employee_id
    WHERE actor.id = public.app_kpi_current_employee_id()
      AND public.app_kpi_current_role() = 'store_manager'
      AND actor.cua_hang_id IS NOT NULL
      AND actor.cua_hang_id = subject.cua_hang_id
  )
)
WITH CHECK (
  public.app_kpi_current_role() IN ('ceo', 'hr_admin')
  OR
  EXISTS (
    SELECT 1 FROM public.nhan_vien actor
    JOIN public.nhan_vien subject ON subject.id = kpi_employee_skill_certifications.employee_id
    WHERE actor.id = public.app_kpi_current_employee_id()
      AND public.app_kpi_current_role() = 'store_manager'
      AND actor.cua_hang_id IS NOT NULL
      AND actor.cua_hang_id = subject.cua_hang_id
  )
);
