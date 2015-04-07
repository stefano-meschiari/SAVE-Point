<?php
require($_SERVER['DOCUMENT_ROOT'] . '/../share/startup.php');
require('db.php');
$url = "/orbits/?mission=gravitykit&" . $_SERVER['QUERY_STRING'];

header("Location: " . $url);
die();
?>
