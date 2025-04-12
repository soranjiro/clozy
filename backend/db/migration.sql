PRAGMA foreign_keys = OFF; -- Disable foreign key constraints

DROP TABLE IF EXISTS wearHistory;
DROP TABLE IF EXISTS clothes;
DROP TABLE IF EXISTS users;

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  email TEXT PRIMARY KEY NOT NULL,
  password TEXT NOT NULL,
  username TEXT NOT NULL
);

CREATE TABLE clothes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  category TEXT,
  size TEXT,
  color TEXT,
  brand TEXT,
  imageKey TEXT,
  imageURL TEXT,
  userID TEXT
);

CREATE TABLE wearHistory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  clothesID INTEGER,
  date TEXT,
  FOREIGN KEY (email) REFERENCES users(email),
  FOREIGN KEY (clothesID) REFERENCES clothes(id)
);
