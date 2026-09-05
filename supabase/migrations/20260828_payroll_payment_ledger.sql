-- Append-only payroll payment ledger with atomic payment/reversal RPCs.

-- Keep this migration runnable on its own after the v3 master schema. The
-- schedule/payroll lockdown migration redefines these helpers with the same
-- signatures, so applying both migrations remains idempotent.
CREATE OR REPLACE FUNCTION public.app_hrm_current_employee_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nv.id
  FROM public.nhan_vien AS nv
  WHERE nv.auth_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_current_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nv.to_chuc_id
  FROM public.nhan_vien AS nv
  WHERE nv.auth_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nv.vai_tro::TEXT
  FROM public.nhan_vien AS nv
  WHERE nv.auth_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_is_payroll_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_hrm_current_role() IN ('quan_tri_hr', 'ban_giam_doc')
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_payroll_slip_in_scope(
  target_period_id UUID,
  target_employee_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ky_luong AS kl
    JOIN public.nhan_vien AS nv ON nv.to_chuc_id = kl.to_chuc_id
    WHERE kl.id = target_period_id
      AND nv.id = target_employee_id
      AND kl.to_chuc_id = public.app_hrm_current_org_id()
  )
$$;

REVOKE ALL ON FUNCTION public.app_hrm_current_employee_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_hrm_current_org_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_hrm_current_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_hrm_is_payroll_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_hrm_payroll_slip_in_scope(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_hrm_current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_is_payroll_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_payroll_slip_in_scope(UUID, UUID) TO authenticated;

CREATE TABLE IF NOT EXISTS public.phieu_luong_thanh_toan (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_chuc_id            UUID NOT NULL REFERENCES public.to_chuc(id) ON DELETE CASCADE,
  ky_luong_id           UUID NOT NULL REFERENCES public.ky_luong(id) ON DELETE RESTRICT,
  phieu_luong_id        UUID NOT NULL REFERENCES public.phieu_luong(id) ON DELETE RESTRICT,
  nhan_vien_id          UUID NOT NULL REFERENCES public.nhan_vien(id) ON DELETE RESTRICT,
  loai_giao_dich        TEXT NOT NULL CHECK (loai_giao_dich IN ('thanh_toan', 'hoan_tac')),
  giao_dich_goc_id      UUID REFERENCES public.phieu_luong_thanh_toan(id) ON DELETE RESTRICT,
  so_tien               DECIMAL(15, 2) NOT NULL CHECK (so_tien > 0),
  phuong_thuc           TEXT NOT NULL CHECK (phuong_thuc IN ('Ngân hàng', 'Tiền mặt', 'Ví điện tử')),
  ngan_hang             TEXT,
  so_tai_khoan          TEXT,
  chu_tai_khoan         TEXT,
  ghi_chu               TEXT,
  anh_chung_tu          TEXT,
  nguoi_thuc_hien_id    UUID REFERENCES public.nhan_vien(id) ON DELETE SET NULL,
  ngay_tao              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_payment_ledger_reversal_source CHECK (
    (loai_giao_dich = 'thanh_toan' AND giao_dich_goc_id IS NULL)
    OR (loai_giao_dich = 'hoan_tac' AND giao_dich_goc_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_payment_ledger_payslip
  ON public.phieu_luong_thanh_toan(phieu_luong_id, ngay_tao DESC);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_period
  ON public.phieu_luong_thanh_toan(ky_luong_id, ngay_tao DESC);

ALTER TABLE public.phieu_luong_thanh_toan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hrm_payment_ledger_select ON public.phieu_luong_thanh_toan;
CREATE POLICY hrm_payment_ledger_select ON public.phieu_luong_thanh_toan
  FOR SELECT TO authenticated
  USING (
    public.app_hrm_is_payroll_admin()
    AND to_chuc_id = public.app_hrm_current_org_id()
  );

CREATE OR REPLACE FUNCTION public.prevent_payroll_payment_ledger_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Payment ledger cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS payment_ledger_immutable ON public.phieu_luong_thanh_toan;
CREATE TRIGGER payment_ledger_immutable
  BEFORE UPDATE OR DELETE ON public.phieu_luong_thanh_toan
  FOR EACH ROW EXECUTE FUNCTION public.prevent_payroll_payment_ledger_mutation();

CREATE OR REPLACE FUNCTION public.prevent_payslip_payment_state_bypass()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF COALESCE(OLD.trang_thai, '') <> 'Đã thanh toán'
    AND COALESCE(NEW.trang_thai, '') = 'Đã thanh toán'
    AND current_setting('app.hrm_payment_recording', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Paid status can only be set by the payment transaction.';
  END IF;

  IF COALESCE(OLD.trang_thai, '') = 'Đã thanh toán'
    AND COALESCE(NEW.trang_thai, '') <> 'Đã thanh toán'
    AND current_setting('app.hrm_payment_reversal', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Paid status can only be cleared by the reversal transaction.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payslip_payment_state_guard ON public.phieu_luong;
CREATE TRIGGER payslip_payment_state_guard
  BEFORE UPDATE OF trang_thai ON public.phieu_luong
  FOR EACH ROW EXECUTE FUNCTION public.prevent_payslip_payment_state_bypass();

REVOKE ALL ON TABLE public.phieu_luong_thanh_toan FROM anon;
REVOKE ALL ON TABLE public.phieu_luong_thanh_toan FROM authenticated;
GRANT SELECT ON TABLE public.phieu_luong_thanh_toan TO authenticated;

CREATE OR REPLACE FUNCTION public.record_payroll_payment(
  p_period_id UUID,
  p_employee_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_bank_name TEXT DEFAULT NULL,
  p_account_number TEXT DEFAULT NULL,
  p_account_name TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_proof_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payslip public.phieu_luong%ROWTYPE;
  v_org_id UUID;
  v_active_transaction_id UUID;
  v_transaction_id UUID;
BEGIN
  IF NOT public.app_hrm_is_payroll_admin() THEN
    RAISE EXCEPTION 'Only payroll admins can record payroll payments.';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;

  IF COALESCE(p_payment_method, '') NOT IN ('Ngân hàng', 'Tiền mặt', 'Ví điện tử') THEN
    RAISE EXCEPTION 'Unsupported payroll payment method.';
  END IF;

  IF p_payment_method = 'Ngân hàng'
    AND (NULLIF(BTRIM(p_bank_name), '') IS NULL
      OR NULLIF(BTRIM(p_account_number), '') IS NULL
      OR NULLIF(BTRIM(p_account_name), '') IS NULL) THEN
    RAISE EXCEPTION 'Bank payment requires bank and account details.';
  END IF;

  SELECT pl.*
  INTO v_payslip
  FROM public.phieu_luong AS pl
  WHERE pl.ky_luong_id = p_period_id
    AND pl.nhan_vien_id = p_employee_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payslip was not found.';
  END IF;

  SELECT kl.to_chuc_id
  INTO v_org_id
  FROM public.ky_luong AS kl
  WHERE kl.id = v_payslip.ky_luong_id;

  IF NOT public.app_hrm_payroll_slip_in_scope(v_payslip.ky_luong_id, v_payslip.nhan_vien_id) THEN
    RAISE EXCEPTION 'Payslip is outside the current organization scope.';
  END IF;

  IF COALESCE(v_payslip.trang_thai, '') <> 'Đã gửi phiếu lương' THEN
    RAISE EXCEPTION 'Payslip is not ready for payment.';
  END IF;

  SELECT ledger.id
  INTO v_active_transaction_id
  FROM public.phieu_luong_thanh_toan AS ledger
  WHERE ledger.phieu_luong_id = v_payslip.id
    AND ledger.loai_giao_dich = 'thanh_toan'
    AND NOT EXISTS (
      SELECT 1
      FROM public.phieu_luong_thanh_toan AS reversal
      WHERE reversal.giao_dich_goc_id = ledger.id
        AND reversal.loai_giao_dich = 'hoan_tac'
    )
  ORDER BY ledger.ngay_tao DESC
  LIMIT 1;

  IF v_active_transaction_id IS NOT NULL THEN
    RAISE EXCEPTION 'Payslip already has an active payment transaction.';
  END IF;

  INSERT INTO public.phieu_luong_thanh_toan (
    to_chuc_id,
    ky_luong_id,
    phieu_luong_id,
    nhan_vien_id,
    loai_giao_dich,
    so_tien,
    phuong_thuc,
    ngan_hang,
    so_tai_khoan,
    chu_tai_khoan,
    ghi_chu,
    anh_chung_tu,
    nguoi_thuc_hien_id
  ) VALUES (
    v_org_id,
    v_payslip.ky_luong_id,
    v_payslip.id,
    v_payslip.nhan_vien_id,
    'thanh_toan',
    p_amount,
    p_payment_method,
    NULLIF(BTRIM(p_bank_name), ''),
    NULLIF(BTRIM(p_account_number), ''),
    NULLIF(BTRIM(p_account_name), ''),
    NULLIF(BTRIM(p_note), ''),
    NULLIF(BTRIM(p_proof_url), ''),
    public.app_hrm_current_employee_id()
  )
  RETURNING id INTO v_transaction_id;

  PERFORM set_config('app.hrm_payment_recording', 'on', true);
  UPDATE public.phieu_luong
  SET trang_thai = 'Đã thanh toán'
  WHERE id = v_payslip.id;

  RETURN v_transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_payroll_payment(
  p_period_id UUID,
  p_employee_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payslip public.phieu_luong%ROWTYPE;
  v_payment public.phieu_luong_thanh_toan%ROWTYPE;
  v_transaction_id UUID;
BEGIN
  IF NOT public.app_hrm_is_payroll_admin() THEN
    RAISE EXCEPTION 'Only payroll admins can reverse payroll payments.';
  END IF;

  SELECT pl.*
  INTO v_payslip
  FROM public.phieu_luong AS pl
  WHERE pl.ky_luong_id = p_period_id
    AND pl.nhan_vien_id = p_employee_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payslip was not found.';
  END IF;

  IF NOT public.app_hrm_payroll_slip_in_scope(v_payslip.ky_luong_id, v_payslip.nhan_vien_id) THEN
    RAISE EXCEPTION 'Payslip is outside the current organization scope.';
  END IF;

  IF COALESCE(v_payslip.trang_thai, '') <> 'Đã thanh toán' THEN
    RAISE EXCEPTION 'Payslip is not marked as paid.';
  END IF;

  SELECT ledger.*
  INTO v_payment
  FROM public.phieu_luong_thanh_toan AS ledger
  WHERE ledger.phieu_luong_id = v_payslip.id
    AND ledger.loai_giao_dich = 'thanh_toan'
    AND NOT EXISTS (
      SELECT 1
      FROM public.phieu_luong_thanh_toan AS reversal
      WHERE reversal.giao_dich_goc_id = ledger.id
        AND reversal.loai_giao_dich = 'hoan_tac'
    )
  ORDER BY ledger.ngay_tao DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active payment transaction exists for this payslip.';
  END IF;

  INSERT INTO public.phieu_luong_thanh_toan (
    to_chuc_id,
    ky_luong_id,
    phieu_luong_id,
    nhan_vien_id,
    loai_giao_dich,
    giao_dich_goc_id,
    so_tien,
    phuong_thuc,
    ngan_hang,
    so_tai_khoan,
    chu_tai_khoan,
    ghi_chu,
    nguoi_thuc_hien_id
  ) VALUES (
    v_payment.to_chuc_id,
    v_payment.ky_luong_id,
    v_payment.phieu_luong_id,
    v_payment.nhan_vien_id,
    'hoan_tac',
    v_payment.id,
    v_payment.so_tien,
    v_payment.phuong_thuc,
    v_payment.ngan_hang,
    v_payment.so_tai_khoan,
    v_payment.chu_tai_khoan,
    COALESCE(NULLIF(BTRIM(p_note), ''), 'Hoàn tác giao dịch ' || v_payment.id::TEXT),
    public.app_hrm_current_employee_id()
  )
  RETURNING id INTO v_transaction_id;

  PERFORM set_config('app.hrm_payment_reversal', 'on', true);
  UPDATE public.phieu_luong
  SET trang_thai = 'Đã gửi phiếu lương'
  WHERE id = v_payslip.id;

  RETURN v_transaction_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_payroll_payment(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reverse_payroll_payment(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payroll_payment(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_payroll_payment(UUID, UUID, TEXT) TO authenticated;
