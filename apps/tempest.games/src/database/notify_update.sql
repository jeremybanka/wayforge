CREATE OR REPLACE FUNCTION notify_update() RETURNS TRIGGER AS $$
DECLARE message TEXT;
record_id INT;
BEGIN IF (TG_OP = 'DELETE') THEN record_id := OLD.id;
ELSE record_id := NEW.id;
END IF;
message := TG_TABLE_NAME || ',' || record_id;
PERFORM pg_notify('table_update', message);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_trigger
  WHERE tgname = 'table_update_trigger'
) THEN CREATE TRIGGER table_update_trigger
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON countries FOR EACH ROW EXECUTE FUNCTION notify_update ();
END IF;
END $$;