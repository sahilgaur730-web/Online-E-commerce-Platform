@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
if "%MAVEN_ARGS%"=="" (
  set "MAVEN_ARGS=-f backend/pom.xml"
) else (
  echo "%MAVEN_ARGS%" | findstr /I /C:"backend/pom.xml" >nul || set "MAVEN_ARGS=-f backend/pom.xml %MAVEN_ARGS%"
)
call "%SCRIPT_DIR%backend\mvnw.cmd" %*
exit /b %ERRORLEVEL%
