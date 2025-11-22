@echo off
echo Setting up Faculty Appraisal Database...
echo.

echo Step 1: Checking if PostgreSQL is installed...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not installed!
    echo Please download and install PostgreSQL from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)
echo ✓ PostgreSQL is installed
echo.

echo Step 2: Creating database and user...
echo Run these commands in a new Command Prompt as Administrator:
echo.
echo psql -U postgres -h localhost
echo [Enter your postgres password when prompted]
echo.
echo Then run these SQL commands:
echo CREATE DATABASE faculty_appraisal;
echo CREATE USER faculty_user WITH ENCRYPTED PASSWORD 'mypassword123';
echo GRANT ALL PRIVILEGES ON DATABASE faculty_appraisal TO faculty_user;
echo GRANT ALL ON SCHEMA public TO faculty_user;
echo GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO faculty_user;
echo GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO faculty_user;
echo \q
echo.
pause

echo.
echo Step 3: Testing database connection...
psql -h localhost -U faculty_user -d faculty_appraisal -c "SELECT version();" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to database!
    echo Make sure PostgreSQL service is running and credentials are correct.
    pause
    exit /b 1
)
echo ✓ Database connection successful
echo.

echo Step 4: Setting up Prisma...
echo Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client!
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo Running database migrations...
npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo ERROR: Failed to run migrations!
    pause
    exit /b 1
)
echo ✓ Database migrations completed
echo.

echo Step 5: Starting the application...
echo Run: npm run dev
echo.
echo Your faculty appraisal system is ready!
echo Access it at: http://localhost:3000
echo.
pause