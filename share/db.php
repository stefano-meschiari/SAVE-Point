<?php
//error_reporting(-1);

// Get connection details from environment variable
$urlp = parse_url($_ENV["DATABASE_URL"]);
echo $_ENV['DATABASE_URL'];

// Build connection string for Postgres
$urls = "host={$urlp['host']} port={$urlp['port']} user={$urlp['user']} password={$urlp['password']}  dbname=" . substr($urlp['path'], 1);
// Open connection
$dbconn = pg_pconnect($urls);

if ($dbconn === FALSE) {
  error_log('Cannot connect to database.');
  error_log(pg_last_error);
  db_generic_error();
  
  die();
};

function db_generic_error() {
  header('Location: /share/error/database_error.php');
}

function db_user() {
  return $_SESSION['username'];
}

function db_user_logged_in() {
  
  if (!isset($_SESSION['username']))
    return FALSE;
  $result = pg_query_params('SELECT COUNT(*) FROM users WHERE username=$1',
                            array($_SESSION['username']));

  if ($result === FALSE)
    return FALSE;
  else {
   
    $arr = pg_fetch_array($result);
    return ($arr[0] != 0);
  }  
}

function db_ensure_logged_in() {
  if (db_user_logged_in() === FALSE) {
    header('Location: users.php');
    
    die();
  }
}

function db_user_details($user) {
  $result = pg_query_params('SELECT * FROM users WHERE username=$1', array($user));
  if ($result === FALSE)
    return FALSE;
  else {
    return pg_fetch_array($result);
  }
}

function db_user_register($user) {
  $user = array_merge(
    array(
      'user_type' => 'user'
    ), $user);

  echo $user['class_id'];
  
  return pg_query_params("INSERT INTO users (username, password, user_type, real_name, email, class_id) VALUES ($1, $2, $3, $4, $5, $6)", array(
    $user['username'],
    $user['password'],
    $user['user_type'],
    $user['real_name'],
    $user['email'],
    $user['class_id']
  ));
}


function db_get_classes() {
  $result = pg_query('SELECT * FROM classes');
  if ($result === FALSE)
    return FALSE;
  else
    return pg_fetch_all($result);
}

function db_class_exists($class_name) {
  $classes = db_get_classes();
  if ($classes === FALSE) return FALSE;

  foreach($classes as $class)
    if ($class['class_name'] == $class_name) {
    return $class['id'];
    }
  return FALSE;
}

?>
