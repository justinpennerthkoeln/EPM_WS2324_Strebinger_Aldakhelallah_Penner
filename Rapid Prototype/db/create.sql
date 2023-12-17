DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS connections;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS tasks;

CREATE TABLE users (
    username varchar(255) NOT NULL,
    password varchar(255) NOT NULL
);

CREATE TABLE collections (
    id int NOT NULL,
    uuid uuid DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    description varchar(255) NOT NULL,
    PRIMARY KEY (id)
);


CREATE TABLE connections (
    id int NOT NULL,
    collection_id int NOT NULL,
    platform_id int NOT NULL,
    platform_key varchar(255) NOT NULL,
    user_id int NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (collection_id) REFERENCES collections(id)
);

CREATE TABLE alerts (
    id int NOT NULL,
    collection_id int NOT NULL,
    name varchar(255) NOT NULL,
    description varchar(255) NOT NULL,
    platform_id int NOT NULL,
    timestamp timestamp NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (collection_id) REFERENCES collections(id)
);

CREATE TABLE tasks (
    id int NOT NULL,
    collection_id int NOT NULL,
    status int NOT NULL,
    name varchar(255) NOT NULL,
    description varchar(250) NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (collection_id) REFERENCES collections(id)
);