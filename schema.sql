-- Records keep the five field names agreed with the Activity 6 frontend.
-- The API checks string lengths with JavaScript's string.length rule, matching
-- that frontend. SQLite length() counts supplementary Unicode differently.
CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT
        CHECK (id > 0 AND id <= 9007199254740991),
    title TEXT NOT NULL
        CHECK (typeof(title) = 'text' AND title = trim(title)),
    category TEXT NOT NULL
        CHECK (typeof(category) = 'text' AND category = trim(category)),
    description TEXT NOT NULL
        CHECK (typeof(description) = 'text' AND description = trim(description)),
    status TEXT NOT NULL
        CHECK (typeof(status) = 'text'
               AND status IN ('Pending', 'In progress', 'Completed'))
);

-- Remember initial setup separately from the records. An empty records table
-- can then stay empty after the last record is deleted and the server restarts.
CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);
