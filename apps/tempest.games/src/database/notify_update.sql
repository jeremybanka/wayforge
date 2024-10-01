-- Function to send notifications
CREATE OR REPLACE FUNCTION notify_update() RETURNS TRIGGER AS $$
DECLARE
    message TEXT;
    record_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        record_id := OLD.id;
    ELSE
        record_id := NEW.id;
    END IF;
    message := TG_TABLE_NAME || ',' || record_id;
    PERFORM pg_notify('table_update', message);
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create triggers dynamically
CREATE OR REPLACE FUNCTION create_notify_trigger(table_name TEXT) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = table_name || '_update_trigger'
    ) THEN
        EXECUTE format('
            CREATE TRIGGER %I_update_trigger
            AFTER INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW EXECUTE FUNCTION notify_update();
        ', table_name, table_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create triggers for multiple tables
CREATE OR REPLACE FUNCTION create_notify_triggers(table_names TEXT[]) RETURNS VOID AS $$
DECLARE
    tname TEXT;
BEGIN
    FOREACH tname IN ARRAY table_names LOOP
        PERFORM create_notify_trigger(tname);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
