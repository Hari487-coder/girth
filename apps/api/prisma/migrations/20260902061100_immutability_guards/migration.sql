-- Girth integrity guards. History cannot be silently changed, even by someone
-- with database credentials using the application role. TRUNCATE (used by
-- tests) does not fire row triggers.

CREATE OR REPLACE FUNCTION girth_forbid_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'girth: % on % is not permitted; this history is append-only', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

-- Audit log: never updated, never deleted
CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION girth_forbid_change();

-- Measurements: the facts are frozen at insert; only review/audit columns move,
-- and a verified reading can only ever be superseded by a correction.
CREATE OR REPLACE FUNCTION girth_measurement_guard() RETURNS trigger AS $$
BEGIN
  IF NEW."treeId" IS DISTINCT FROM OLD."treeId"
     OR NEW."submittedById" IS DISTINCT FROM OLD."submittedById"
     OR NEW."submittedAt" IS DISTINCT FROM OLD."submittedAt"
     OR NEW."measurementDate" IS DISTINCT FROM OLD."measurementDate"
     OR NEW."measurementHeightCm" IS DISTINCT FROM OLD."measurementHeightCm"
     OR NEW."girthCm" IS DISTINCT FROM OLD."girthCm"
     OR NEW."latitude" IS DISTINCT FROM OLD."latitude"
     OR NEW."longitude" IS DISTINCT FROM OLD."longitude"
     OR NEW."correctsId" IS DISTINCT FROM OLD."correctsId" THEN
    RAISE EXCEPTION 'girth: measurement facts are immutable; submit a correcting measurement instead'
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD."verificationStatus" = 'VERIFIED' AND NEW."verificationStatus" NOT IN ('VERIFIED', 'SUPERSEDED') THEN
    RAISE EXCEPTION 'girth: a verified measurement can only be superseded, never un-verified'
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER measurement_guard
  BEFORE UPDATE ON "Measurement"
  FOR EACH ROW EXECUTE FUNCTION girth_measurement_guard();

CREATE TRIGGER measurement_no_delete
  BEFORE DELETE ON "Measurement"
  FOR EACH ROW EXECUTE FUNCTION girth_forbid_change();

-- Payment ledger: amounts and attribution are frozen; paid stays paid.
CREATE OR REPLACE FUNCTION girth_ledger_guard() RETURNS trigger AS $$
BEGIN
  IF NEW."amountPaise" IS DISTINCT FROM OLD."amountPaise"
     OR NEW."currency" IS DISTINCT FROM OLD."currency"
     OR NEW."farmerId" IS DISTINCT FROM OLD."farmerId"
     OR NEW."treeId" IS DISTINCT FROM OLD."treeId"
     OR NEW."measurementId" IS DISTINCT FROM OLD."measurementId"
     OR NEW."reason" IS DISTINCT FROM OLD."reason"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'girth: ledger entries are immutable; record an adjustment entry instead'
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD."status" = 'PAID' AND NEW."status" <> 'PAID' THEN
    RAISE EXCEPTION 'girth: a paid ledger entry cannot change status'
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_guard
  BEFORE UPDATE ON "PaymentLedger"
  FOR EACH ROW EXECUTE FUNCTION girth_ledger_guard();

CREATE TRIGGER ledger_no_delete
  BEFORE DELETE ON "PaymentLedger"
  FOR EACH ROW EXECUTE FUNCTION girth_forbid_change();

-- Evidence and history rows are never deleted
CREATE TRIGGER audit_no_delete
  BEFORE DELETE ON "Audit"
  FOR EACH ROW EXECUTE FUNCTION girth_forbid_change();

CREATE TRIGGER measurement_check_no_delete
  BEFORE DELETE ON "MeasurementCheck"
  FOR EACH ROW EXECUTE FUNCTION girth_forbid_change();

CREATE TRIGGER photo_no_delete
  BEFORE DELETE ON "Photo"
  FOR EACH ROW EXECUTE FUNCTION girth_forbid_change();

CREATE TRIGGER tree_status_history_no_delete
  BEFORE DELETE ON "TreeStatusHistory"
  FOR EACH ROW EXECUTE FUNCTION girth_forbid_change();

-- Trees: identity is permanent
CREATE OR REPLACE FUNCTION girth_tree_guard() RETURNS trigger AS $$
BEGIN
  IF NEW."publicId" IS DISTINCT FROM OLD."publicId" OR NEW."seq" IS DISTINCT FROM OLD."seq" THEN
    RAISE EXCEPTION 'girth: a tree id is permanent and cannot be changed'
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tree_guard
  BEFORE UPDATE ON "Tree"
  FOR EACH ROW EXECUTE FUNCTION girth_tree_guard();

CREATE TRIGGER tree_no_delete
  BEFORE DELETE ON "Tree"
  FOR EACH ROW EXECUTE FUNCTION girth_forbid_change();
