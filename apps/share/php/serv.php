<?php
require_once('../../../share/startup.php');
require_once('db.php');

if (!isset($_GET['action']))
  die();

if ($_GET['action'] === 'store') {
  $ret = db_store_param($_POST['val']);
  if ($ret !== FALSE)
    echo $ret;
  die();
} else if ($_GET['action'] === 'get') {
  $ret = db_get_param($_GET['id']);
  if ($ret !== FALSE)
    echo $ret;
  die();
}


?>
