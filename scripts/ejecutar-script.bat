@echo off
echo ====================================
echo Ejecutando Script SQL para EcoMarketplace
echo ====================================
echo.

REM Solicitar información de conexión
set /p DB_SERVER="Servidor SQL (localhost): "
if "%DB_SERVER%"=="" set DB_SERVER=localhost

set /p DB_USER="Usuario (Eco): "
if "%DB_USER%"=="" set DB_USER=Eco

set /p DB_PASSWORD="Contraseña: "
if "%DB_PASSWORD%"=="" (
    echo ERROR: La contraseña es requerida
    pause
    exit /b 1
)

echo.
echo Ejecutando script create-database.sql...
echo.

sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -i create-database.sql

if %errorlevel% == 0 (
    echo.
    echo ====================================
    echo Script ejecutado exitosamente!
    echo ====================================
) else (
    echo.
    echo ====================================
    echo ERROR: Fallo la ejecucion del script
    echo ====================================
    echo Verifica:
    echo - Que SQL Server este corriendo
    echo - Que las credenciales sean correctas
    echo - Que tengas permisos para crear bases de datos
)

echo.
pause

