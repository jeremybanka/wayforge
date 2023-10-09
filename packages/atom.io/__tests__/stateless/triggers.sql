-- Assuming you have a table named 'your_table'
CREATE OR REPLACE FUNCTION notify_trigger() RETURNS trigger AS $$
DECLARE message text;
BEGIN message := TG_TABLE_NAME || ',' || NEW.id;
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
    OR DELETE ON your_table FOR EACH ROW EXECUTE FUNCTION notify_trigger();
END IF;
END $$;