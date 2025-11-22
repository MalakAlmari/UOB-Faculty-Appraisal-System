-- Create database and user (run as postgres superuser)
CREATE DATABASE faculty_appraisal;
CREATE USER faculty_user WITH ENCRYPTED PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE faculty_appraisal TO faculty_user;

-- Connect to the database
\c faculty_appraisal;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO faculty_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO faculty_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO faculty_user;
