# jrs
This project will house a set of educational web apps. Each
web app is a single-page application written in HTML5/JavaScript, with
a small backend component written in PHP (possibly changing in the
near future).

The directory structure houses the custom code and several free &
open-source libraries that are used by the code.

A frequently-updated live version of the in-development apps is going
to be hosted at http://jrs-edu.herokuapp.com.

## Directory structure
- *Makefile* a Makefile that is used to run pre-processing jobs on the
  code (e.g. convert .less files into .css). Use "make watch" to
  automatically watch the directory for changes in the background. Use
  "make devserver" to start a webserver at http://localhost:8000.
- *share/* contains the PHP backend.
    - *share/skeleton* contains templates for the "header" part of the
    HTML page (e.g. doctype, head, etc.) and "footer" (closing tags).
- *apps/* is where the apps are housed, and represents the document
root of the website.

# Setting up a local development environment

(1) Download Postgres.app from http://postgresapp.com; move it to your
Applications folder, double click on it, and ensure it runs at
startup.

(2) Install MacPorts (https://www.macports.org). Once MacPorts is
installed, ensure that /opt/local/bin is part of the PATH environment
variable, e.g. add this line to your bash startup script (~/.bashrc or
~/.bash_profile):

`export
PATH=/opt/local/bin:/Applications/Postgres.app/Contents/Versions/9.3/bin/:$PATH`

(this also adds the Postgres binaries -- which are contained in the
Postgres.app app bundle -- to the PATH). 

(3) Install Xcode from the App Store. Accept Xcode's licence from the
command line by typing

`sudo xcodebuild -license`

from a command line.

(4) Install the following software through MacPorts:

`sudo port install nodejs php55 php55-postgresql npm`

(5) Install the LESS compiler:

`sudo npm install -g less`

(6) Download the Heroku toolbet (if you haven't already) from here:
https://devcenter.heroku.com/articles/getting-started-with-php#set-up
and run the Installer.

(7) Navigate to the project directory (save-point) and set up Heroku
to track the Git repository, if you haven't already:

`heroku git:remote -a save-point`

(8) Add the following line to your Bash startup script:

`export DATABASE_URL="postgres://$(whoami)@localhost:5432/$(whoami)"`

(9) Restart your shell(s) to make sure the environment variables are set.

# The development lifecycle
(1) Cd to the project directory, make sure to have the most recent
version of the repository:

`git pull`

(2) Make sure Postgres.app is running. To download the current
database on Heroku to your local installation, type

`make download_db`

(3) Open a terminal dedicated to running the local dev server. Type

`make devserver`

This should (a) start the PHP server and listen for requests, and (b)
open the default browser pointing to localhost:8800. That should
display the login for the dashboard. To exit the server, type
Ctrl-C. Most of the time, you want to have the server always running
in the background -- just reload the page in the server to see any
changed files.

The server will also echo the path of the files being requested by the
web browser.

(4) Open a terminal dedicated to running automated tasks:
e.g. translating yaml files to the json format. In that terminal, type

`make watch`

This will run a process in the background, which runs a few tasks
automatically as files are changed. To quit it, type Ctrl-C. Most of
the time, you want it running in the background.

(5) Make changes to files and test in the browser. You can also test
the website in the iOS simulator by opening Xcode -> Developer tool ->
iOS simulator.

(6) Commit and push your changes to GitHub:

`git add -A; git commit -am "My commit message"; git push`

(7) To see changes in Heroku, type

`git push heroku master`

# Some useful files
## YAML files
YAML is a format used for complex configuration files. It is used
inside each app directory (e.g. gravity/app.yaml, dashboard/app.yaml,
etc.) to configure each app.

Both the PHP server and the JavaScript code typically read in the
content of those files in order to shape the application;
e.g. gravity/app.yaml contains a list of missions and their
properties. Its contents are translated into data structures in both
PHP and JavaScript: e.g., a YAML file that looks like this:


    description: Hello!
    properties:
      - Cute
      - Neat
      - Wise

would be translated into this JavaScript object:

`{description: "Hello", properties: ['Cute', 'Neat', 'Wise']}`

(e.g. an object with two fields "description" and "properties"; the
"properties" field contains an array of three strings). This article:
http://en.wikipedia.org/wiki/YAML talks about the format. Note that
indentation is significant to identify arrays and other structures.

JavaScript cannot natively read YAML, so the `make watch` process
translates YAML files into JSON files in each app directory. JSON is
a completely equivalent format, but it is much less readable. The JSON
file should never be modified directly, and it might be overwritten by
`make watch` -- instead one should only work
on the YAML file. 

## The app.yaml file for Gravity
### Message boxes

In the "help" section, different message boxes can be set up that will
pop up on specific events. A typical help section will look like this:

help:
   - on: start
     message: |
       Hello there stranger!
       @proceed
       
   - on: proceed
     message: |
       You clicked next! Good job!

### Available events
* on: start is shown at the beginning of the level.
* on: proceed is shown when the user clicks on the "Next" button. You
  can set up multiple on: proceed message boxes, and they will be
  shown in order.
* on: change:nplanets is shown when the user adds a planet.
* on: planet:drag is shown when the user drags a planet.
* on: planet:dragvelocity is shown when the user drags the velocity
vector.
* on: win is shown when the user completes the level.
* on: lose is shown when the user fails to complete the level.

### Available tags in the message
Special strings can be inserted in the message that will be translated
into non-text content (e.g. the Next button, avatar images, etc) or
commands that influence the game (e.g. making the screen
non-interactive, make the stars rotate, etc.). These are the tags that
are implemented:

* @fly makes the stars spin
* @noninteractive ignores clicks from the user on the game area (this
is only active for the current help box).
* @name is the username of the player.
* @boss, @groknar are the avatars for characters
* @wait-5, @wait-10 show the message for 5/10 seconds before proceeding to
the next message.
* @hide-5, @hide-10 show the message for 5/10 seconds, then hide the message.
* @proceed inserts the "Next" button
* @close inserts the "Close" button
* `*text*` makes the text bold.
* Use two carriage returns to create a paragraph.
