<?php
// FIXME: this load/save system has races.

require($_SERVER['DOCUMENT_ROOT'] . '/../share/startup.php');
require('db.php');

if (db_user_logged_in() === FALSE) {
  die();
}

$user = db_user();
$user_id = db_user_details($user)['id'];
$game = 'gravity_data';

if ($_GET['action'] == 'load') {
  $cur = pg_query_params("SELECT mission_data FROM gravity_data WHERE user_id=$1", array($user_id));
  if ($cur === FALSE || pg_num_rows($cur) === 0) {
    die();
  } else {    
    $res = pg_fetch_all($cur);
    echo $res[0]['mission_data'];
  }
} else if ($_GET['action'] == 'save') {
  $data = $_POST['data'];
  $earned_stars = $_POST['earned_stars'];
  
  $cur = pg_query_params("SELECT mission_data FROM gravity_data WHERE user_id=$1", array($user_id));
  
  if (cur === FALSE) {
    echo "error";
    die();
  }
  
  if (pg_num_rows($cur) === 0) {
    $cur = pg_query_params("INSERT INTO gravity_data (user_id, mission_data, earned_stars) VALUES ($1, $2, $3)",
                    array($user_id, $data, $earned_stars));
    if ($cur === FALSE) {
      echo "error";
      die();
    } else {
      echo "success";
      die();
    }    
  } else {
    $cur = pg_query_params("UPDATE gravity_data SET (mission_data, earned_stars) = ($1, $2) WHERE user_id=$3",
                           array($data, $earned_stars, $user_id));
    if ($cur === FALSE || pg_affected_rows($cur) == 0) {
      echo "error";
      die();
    } else {
      echo "success";
      die();
    }    
  }
} else if ($_GET['action'] == 'reset') {
  pg_query_params("DELETE FROM gravity_data WHERE user_id=$1", array($user_id));
  die();
}

?>
