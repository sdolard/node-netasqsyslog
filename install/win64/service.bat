:: NETASQ SYSLOG service script control
@echo off

:: Vars
SET NSSERVICE_NAME=NETASQSYSLOG
SET BATCH_SCRIPT_PATH=%cd%
SET NSSM=%BATCH_SCRIPT_PATH%\nssm.exe
SET NODE_SCRIPT_BIN_PATH=%BATCH_SCRIPT_PATH%\..\..\bin
SET NODE_SCRIPT=%NODE_SCRIPT_BIN_PATH%\nnsyslog.js
SET NODE_SCRIPT_ARGS=-c %NODE_SCRIPT_BIN_PATH%\config.file

IF "%1"=="install" goto INSTALL
IF "%1"=="uninstall" goto UNINSTALL
IF "%1"=="run" goto RUN

:: help
echo NETASQ SYSLOG script installer
echo Usage: install.bat install/uninstall/run
echo   install:   install and start %NSSERVICE_NAME% service
echo   uninstall: stop and uninstall %NSSERVICE_NAME% service
echo   run:       run service %NSSERVICE_NAME% in this console
GOTO END


:INSTALL
cd "%NODE_SCRIPT_BIN_PATH%"
echo Installing %NSSERVICE_NAME%...
%NSSM% install "%NSSERVICE_NAME%" node %NODE_SCRIPT% %NODE_SCRIPT_ARGS%
IF "%ERRORLEVEL%"=="0" (
  echo Starting %NSSERVICE_NAME%...
  net start %NSSERVICE_NAME%
)
GOTO END



:UNINSTALL
cd "%NODE_SCRIPT_BIN_PATH%"
echo Stopping %NSSERVICE_NAME%...
net stop %NSSERVICE_NAME%
IF "%ERRORLEVEL%"=="0" (
  echo Uninstalling %NSSERVICE_NAME%...
  %NSSM% remove "%NSSERVICE_NAME%" confirm
)
GOTO END


:RUN
node %NODE_SCRIPT% %NODE_SCRIPT_ARGS%
GOTO END


:END
cd "%BATCH_SCRIPT_PATH%"