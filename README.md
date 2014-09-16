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

continue...

# Requirements
## HTML5/JavaScript apps 
- Backbone.js
- Paper.js

continue...

## Backend
- Postgres configuration on Heroku:
https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js
- Postgres connection in PHP: http://mattstauffer.co/blog/laravel-on-heroku-using-a-postgresql-database
