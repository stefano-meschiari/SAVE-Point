<?php
require_once('../../share/startup.php');
require_once('db.php');
if (db_user_logged_in() === FALSE) {
  die();
}
if (!isset($_GET['action']))
    die();

$offensive = array(
    'DIK',
    'COK',
    'TIT',
    'FAG'
);

if ($_GET['action'] == 'add') {
    $name = trim($_POST['name']);
    $points = trim($_POST['points']);
    if ($name === "" || points === 0)
        die();
    if (strlen($name) > 3)
        die();
    $name = strtoupper($name);
    if (in_array($name, $offensive))
        die();
    
    $cur = pg_query_params("INSERT INTO spc_data (name, points) VALUES ($1, $2)", array($name, $points));
    error_log($name);
    error_log($points);
} else if ($_GET['action'] == 'get') {
    $cur = pg_query("SELECT * FROM spc_data ORDER BY points DESC");
    $arr = pg_fetch_all($cur);
    echo json_encode($arr);
}
?>
