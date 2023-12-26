DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS platforms;
DROP TYPE IF EXISTS platform;
DROP TYPE IF EXISTS role;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS tasks;
DROP TYPE IF EXISTS status;
DROP TABLE IF EXISTS ownerships;
DROP TABLE IF EXISTS todos;
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS votes;

CREATE TYPE platform AS ENUM ('github', 'gitlab', 'obsidian', 'notion', 'figma', 'dribbble');
CREATE TYPE role AS ENUM ('designer', 'programmer');
CREATE TYPE status AS ENUM ('todo', 'in progress', 'in review', 'done');

CREATE TABLE users (
    id SERIAL PRIMARY KEY NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password VARCHAR(200) NOT NULL
);

CREATE TABLE collections (
    collection_id SERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(200) NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

CREATE TABLE platforms (
    platform_id SERIAL PRIMARY KEY NOT NULL,
    user_id INTEGER NOT NULL,
    collection_id INTEGER NOT NULL,
    platform platform NOT NULL,
    platform_key VARCHAR(200) NOT NULL,
    target_document VARCHAR(200) NOT NULL
);

ALTER TABLE platforms ADD CONSTRAINT fk_platforms_user_3948fbhrgz45i4ts FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE platforms ADD CONSTRAINT fk_platforms_collection_84376588dsuifhi734 FOREIGN KEY (collection_id) REFERENCES collections (collection_id);

CREATE TABLE memberships (
    membership_id SERIAL PRIMARY KEY NOT NULL,
    user_id INTEGER NOT NULL,
    collection_id INTEGER NOT NULL,
    role role NOT NULL
);

ALTER TABLE memberships ADD CONSTRAINT fk_memberships_user_3948fbhrgz45i4ts FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE memberships ADD CONSTRAINT fk_memberships_collection_84376588dsuifhi734 FOREIGN KEY (collection_id) REFERENCES collections (collection_id);

CREATE TABLE alerts (
    alert_id SERIAL PRIMARY KEY NOT NULL,
    membership_id INTEGER NOT NULL,
    platform_id INTEGER NOT NULL,
    collection_id INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

ALTER TABLE alerts ADD CONSTRAINT fk_alerts_membership_3948fbhrgz45i4ts FOREIGN KEY (membership_id) REFERENCES memberships (membership_id);
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_collection_84376588dsuifhi734 FOREIGN KEY (collection_id) REFERENCES collections (collection_id);
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_platform_84376588dsuifhi734 FOREIGN KEY (platform_id) REFERENCES platforms (platform_id);

CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY NOT NULL,
    collection_id INTEGER NOT NULL,
    platform_id INTEGER NOT NULL,
    status status NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(200) NOT NULL
);

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_collection_84376588dsuifhi734 FOREIGN KEY (collection_id) REFERENCES collections (collection_id);
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_platform_84376588dsuifhi734 FOREIGN KEY (platform_id) REFERENCES platforms (platform_id);

CREATE TABLE ownerships (
    ownership_id SERIAL PRIMARY KEY NOT NULL,
    task_id INTEGER NOT NULL,
    membership_id INTEGER NOT NULL
);

ALTER TABLE ownerships ADD CONSTRAINT fk_ownerships_task_84376588dsuifhi734 FOREIGN KEY (task_id) REFERENCES tasks (task_id);
ALTER TABLE ownerships ADD CONSTRAINT fk_ownerships_membership_84376588dsuifhi734 FOREIGN KEY (membership_id) REFERENCES memberships (membership_id);

CREATE TABLE todos (
    todo_id SERIAL PRIMARY KEY NOT NULL,
    task_id INTEGER NOT NULL,
    done BOOLEAN NOT NULL,
    description VARCHAR(200) NOT NULL
);

ALTER TABLE todos ADD CONSTRAINT fk_todos_task_84376588dsuifhi734 FOREIGN KEY (task_id) REFERENCES tasks (task_id);

CREATE TABLE feedbacks (
    feedback_id SERIAL PRIMARY KEY NOT NULL,
    membership_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    comment VARCHAR(200) NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

ALTER TABLE feedbacks ADD CONSTRAINT fk_feedbacks_membership_84376588dsuifhi734 FOREIGN KEY (membership_id) REFERENCES memberships (membership_id);
ALTER TABLE feedbacks ADD CONSTRAINT fk_feedbacks_task_84376588dsuifhi734 FOREIGN KEY (task_id) REFERENCES tasks (task_id);

CREATE TABLE votes (
    vote_id SERIAL PRIMARY KEY NOT NULL,
    feedback_id INTEGER NOT NULL,
    upvote BOOLEAN NOT NULL
);

ALTER TABLE votes ADD CONSTRAINT fk_votes_feedback_84376588dsuifhi734 FOREIGN KEY (feedback_id) REFERENCES feedbacks (feedback_id);