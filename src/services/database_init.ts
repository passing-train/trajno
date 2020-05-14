export default `

    CREATE TABLE IF NOT EXISTS tempo_customers
    (
        id                         INTEGER PRIMARY KEY,
        customer_external_code     TEXT,
        name                       TEXT
    );

    CREATE TABLE IF NOT EXISTS tempo_projects
    (
        id                        INTEGER PRIMARY KEY,
        project_external_code     TEXT,
        name                      TEXT,
        tempo_customer_id         INTEGER,
        FOREIGN KEY (tempo_customer_id) REFERENCES tempo_customers (id)
    );

    CREATE TABLE IF NOT EXISTS tempo_entries
    (
        id                        INTEGER PRIMARY KEY,
        project_external_code     TEXT,
        tempo_customer_id         INTEGER,
        tempo_project_id          INTEGER,
        entry_text                VARCHAR
        last_in_block             INTEGER,
        not_in_export             INTEGER,
        sticky                    INTEGER,
        time_delta                INTEGER,
        created_at                INTEGER,
        extra_time                FLOAT,
        FOREIGN KEY (tempo_customer_id) REFERENCES tempo_customers (id),
        FOREIGN KEY (tempo_project_id) REFERENCES tempo_projects (id)
    );

    CREATE TABLE IF NOT EXISTS processes
    (
        id       INTEGER PRIMARY KEY,
        title    TEXT,
        path     TEXT,
        type_str TEXT,
        FOREIGN KEY (type_str) REFERENCES productivity_type (type)
    );

    CREATE TABLE IF NOT EXISTS windows
    (
        id         INTEGER PRIMARY KEY,
        process_id INTEGER NOT NULL,
        title      TEXT    NOT NULL,
        type_str   TEXT DEFAULT NULL,
        FOREIGN KEY (process_id) REFERENCES processes (id),
        FOREIGN KEY (type_str) REFERENCES productivity_type (type)
    );

    CREATE TABLE IF NOT EXISTS heartbeats
    (
        process_id INTEGER NOT NULL,
        window_id  INTEGER NOT NULL,
        start_time INTEGER NOT NULL,
        end_time   INTEGER NOT NULL,
        idle       BOOLEAN DEFAULT FALSE NOT NULL,
        FOREIGN KEY (process_id) REFERENCES processes (id),
        FOREIGN KEY (window_id) REFERENCES windows (id)
    );

    CREATE TABLE IF NOT EXISTS productivity_type
    (
        type      TEXT NOT NULL,
        color     TEXT NOT NULL,
        removable BOOLEAN DEFAULT TRUE,
        UNIQUE (type)
    );

    CREATE TABLE IF NOT EXISTS settings
    (
        'key'    TEXT NOT NULL PRIMARY KEY,
        value    TEXT NOT NULL,
        metadata BOOLEAN DEFAULT FALSE NOT NULL
    );

    INSERT OR
    REPLACE
    INTO productivity_type
    VALUES ('unknown', '#808585', 'false');

    INSERT OR
    REPLACE
    INTO productivity_type
    VALUES ('work', '#84ba5b', 'false');

    INSERT OR
    REPLACE
    INTO productivity_type
    VALUES ('unproductive', '#d35e60', 'false');

    INSERT OR
    REPLACE
    INTO productivity_type
    VALUES ('games', '#9067a7', 'false');

    INSERT OR
    REPLACE
    INTO productivity_type
    VALUES ('social', '#7293cb', 'false');

    INSERT OR
    REPLACE
    INTO productivity_type
    VALUES ('other', '#b4ba5b', 'false');
`;
