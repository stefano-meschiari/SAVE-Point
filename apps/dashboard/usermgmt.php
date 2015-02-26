<?php

require_once('../../share/startup.php');
require_once('db.php');
require_once('messages.php');



function is_registration_invalid($post) {
  $user = $_POST['username'];

  if (trim($user) == "" || !ctype_alnum(str_replace(array('.', '_', '-'), '', $user)))
    return "USERNAME_FMT";

  if (db_user_details($user) !== FALSE)
    return "USERNAME_EXISTS";

  $class = $_POST['class'];
  if (!db_class_exists($class))
    $class = '--';
    
  $password = $_POST['password'];
  $password2 = $_POST['password2'];
  if ($password != $password2)
    return "PASSWORD_MISMATCH";
  if (strlen($password) < 8)
    return "PASSWORD_SHORT";
  
  if (trim($_POST['full-name']) == "")
    return "FULLNAME_INVALID";
  if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL))
    return "EMAIL_INVALID";
  
  return FALSE;
}

if ($_GET['action'] == 'login') {
  $user = $_POST['username'];
  $password = $_POST['password'];
  $details = db_user_details($user);
  if ($details === FALSE || !password_verify($password, $details['password'])) {
    redirect_alert('LOGIN_NOT_VALID', 'login');
  } else {
    db_login($user, $password);
  }
} else if ($_GET['action'] == 'validate') {
  $invalid = is_registration_invalid();
  if ($invalid !== FALSE)
    print($ERROR_MESSAGES[$invalid]);
  die();
} else if ($_GET['action'] == 'register') {
  $invalid = is_registration_invalid();
  if ($invalid === FALSE) {

    $password_hash = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $class = $_POST['class'];
    if (!db_class_exists($class))
      $class = '--';
    
    $classid = db_class_exists($class);

    
    $result = db_user_register(array(
      'username' => $_POST['username'],
      'password' => $password_hash,
      'real_name' => $_POST['full-name'],
      'email' => $_POST['email'],
      'class_id' => $classid
    ));

    if ($result === FALSE) {
      error_log(pg_last_error());
      redirect_alert('REGISTRATION_NOT_SUCCESSFUL', 'register');      
    } else {
      $_SESSION['username'] = $_POST['username'];
      redirect_dashboard();
    }
    
  } else {
    redirect_alert($invalid, "register");
  } 
} else if ($_GET['action'] == 'logout') {
  session_unset();
  redirect_dashboard();
}

?>
