@echo off
mkdir controllers
mkdir controllers\admin
mkdir controllers\manager
mkdir controllers\user
mkdir routes
mkdir routes\admin
mkdir routes\manager
mkdir routes\user
mkdir middleware
mkdir models

type NUL > controllers\admin\adminController.js
type NUL > controllers\manager\managerController.js
type NUL > controllers\user\userController.js
type NUL > routes\admin\index.js
type NUL > routes\manager\index.js
type NUL > routes\user\index.js
type NUL > middleware\auth.js
type NUL > models\user.js
type NUL > app.js
type NUL > .gitignore

echo Files and directories created successfully.
