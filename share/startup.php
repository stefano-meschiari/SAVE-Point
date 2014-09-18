<?php
// start session
session_start();
define(ROOT, $_SERVER['DOCUMENT_ROOT'] . '/../');

set_include_path(get_include_path() . PATH_SEPARATOR . ROOT);
set_include_path(get_include_path() . PATH_SEPARATOR . ROOT . '/share/');

require_once('vendor/autoload.php');
require_once('includes/template.php');

//require_once('share/db.php');
?>
