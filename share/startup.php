<?php
// Define global constants and initialize functions.

define('ROOT', '../../');
define('DOCUMENT_ROOT', '../');

set_include_path(get_include_path() . PATH_SEPARATOR . ROOT);
require_once('vendor/autoload.php');
require_once('share/includes/template.php');
?>
