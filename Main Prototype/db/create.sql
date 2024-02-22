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
DROP TABLE IF EXISTS replies;
DROP TYPE IF EXISTS alertType;
DROP TABLE IF EXISTS alertSettings;

CREATE TYPE platform AS ENUM ('github', 'gitlab', 'markdown', 'notion', 'figma', 'dribbble', '-');
CREATE TYPE role AS ENUM ('designer', 'programmer', 'product owner', 'project manager');
CREATE TYPE status AS ENUM ('todo', 'running', 'review', 'done');
CREATE TYPE alertType AS ENUM ('task created', 'task updated', 'task completed', 'task feedbacks', 'task feedback replies', 'collection renaming', 'collection description changes', 'collection member changes', 'platform changes', 'design changes', 'design comments', 'design comment replies', 'git commits', 'git issue comments', 'git merge', 'git push', 'git issue created');

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id SERIAL PRIMARY KEY NOT NULL,
    user_uuid uuid DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(200) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL
);

CREATE TABLE collections (
    collection_id SERIAL PRIMARY KEY NOT NULL,
    uuid uuid DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description VARCHAR(200) NULL,
    timestamp TIMESTAMP NOT NULL
);

CREATE TABLE platforms (
    platform_id SERIAL PRIMARY KEY NOT NULL,
    user_id INTEGER NOT NULL,
    collection_id INTEGER NOT NULL,
    platform platform NOT NULL,
    platform_key VARCHAR(200) NOT NULL,
    target_document VARCHAR(200) NOT NULL,
    username VARCHAR(200) NULL
);

ALTER TABLE platforms ADD CONSTRAINT fk_platforms_user_3948fbhrgz45i4ts FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE platforms ADD CONSTRAINT fk_platforms_collection_84376588dsuifhi734 FOREIGN KEY (collection_id) REFERENCES collections (collection_id);

CREATE TABLE memberships (
    membership_id SERIAL PRIMARY KEY NOT NULL,
    user_id INTEGER NOT NULL,
    collection_id INTEGER NOT NULL,
    role role NULL
);

ALTER TABLE memberships ADD CONSTRAINT fk_memberships_user_3948fbhrgz45i4ts FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE memberships ADD CONSTRAINT fk_memberships_collection_84376588dsuifhi734 FOREIGN KEY (collection_id) REFERENCES collections (collection_id);

CREATE TABLE alerts (
    alert_id SERIAL PRIMARY KEY NOT NULL,
    membership_id INTEGER NULL,
    collection_id INTEGER NOT NULL,
    comment VARCHAR(200) NOT NULL,
    alert_type alertType NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

ALTER TABLE alerts ADD CONSTRAINT fk_alerts_collection_84376588dsuifhi734 FOREIGN KEY (collection_id) REFERENCES collections (collection_id);

CREATE TABLE alertSettings (
    alert_settings_id SERIAL PRIMARY KEY NOT NULL,
    collection_id INTEGER NOT NULL,
    setting VARCHAR(200) NOT NULL,
    value BOOLEAN NOT NULL
);


ALTER TABLE alertSettings ADD CONSTRAINT fk_alertSettings_collection_84376588dsuifhi734 FOREIGN KEY (collection_id) REFERENCES collections (collection_id);

CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY NOT NULL,
    collection_id INTEGER NOT NULL,
    platform_id INTEGER NOT NULL,
    status status NOT NULL,
    status_index INTEGER NOT NULL, -- Index, um eine Task auch innerhalb des Status verschieben zu können
    name VARCHAR(200) NOT NULL,
    description VARCHAR(200) NULL
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
    description VARCHAR(200) NOT NULL,
    timestamp TIMESTAMP NOT NULL
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

CREATE TABLE replies (
    reply_id SERIAL PRIMARY KEY NOT NULL,
    username VARCHAR(200) NOT NULL,
    feedback_id INTEGER NOT NULL,
    comment VARCHAR(200) NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

ALTER TABLE replies ADD CONSTRAINT fk_replies_feedback_84376588dsuifhi734 FOREIGN KEY (feedback_id) REFERENCES feedbacks (feedback_id);