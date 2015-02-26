<?php

require_once('../../share/startup.php');
require_once('db.php');
require_once('messages.php');

db_check_special_user();
db_ensure_logged_in();

$cfg = init();
write_header($cfg);
include('canvas.html');
?>

<div id="app-rotate">
    Hold your device in landscape orientation.
    <div>
        <img src="/share/img/ipad.png" class="uk-align-center">
    </div>
</div>

<div class="uk-container uk-container-center uk-margin-top uk-margin-large-bottom" id="container">
  
  <!--[if lt IE 7]>
  <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
  <![endif]-->

    <div class="uk-clearfix logout-header">
        <?php if (!db_is_kiosk_user()) { ?>

            <div class="uk-float-right uk-button-dropdown" data-uk-dropdown>
                <button class="uk-button primary-button"><i class="fa fa-user"></i> <?= db_user() ?> <i class="fa fa-caret-down"></i></button>
                <div class="uk-dropdown uk-dropdown-small">
                    <ul class="uk-nav uk-nav-dropdown">
                        <li><a href="/dashboard/usermgmt.php?action=logout">Log out</a></li>
                    </ul>
                </div>
            </div>
        <?php } ?>
    </div>

  <div id="content">
      <div class="uk-grid">
        <div class="app-col uk-width-1-3">
          <a href="/orbits/"><img src="img/orbits.png" width="192" class="uk-animation-hover uk-animation-scale app-icon"></a>
          <div class="app-title">
            Orbits            
          </div>
          <div class="app-subtitle">
            Help an alien civilization design new planetary systems.
          </div>
        </div>
        <div class="app-col uk-width-1-3">
          <a href="http://www.stefanom.org/spc"><img src="img/spc.png" width="192" class="uk-animation-hover uk-animation-scale app-icon"></a>
          <div class="app-title">
            Super Planet Crash 
          </div>
          <div class="app-subtitle">
            Create and destroy your own Solar System.
          </div>
        </div>
        <div class="app-col uk-width-1-3">
            <a href="http://www.stefanom.org/systemic-online"><img src="img/systemic_live.png" width="192" class="uk-animation-hover uk-animation-scale app-icon"></a>
          <div class="app-title">
            Systemic Live
          </div>
          <div class="app-subtitle">
            Discover planets around other stars.
          </div>

        </div>    
      </div>

      <?php
      if (db_user_is_instructor(db_user())) {
        $classes = db_instructor_classes(db_user());
      ?>
        <div class="separator-center margin-v-50"></div>
      <div id="instructor">
        <div class="instructor-title">Instructor report</div>
      
      <?php
        foreach ($classes as $class) {
      ?>
        <a class="uk-button primary-button instructor-class" href="/dashboard/instructor_report.php?class=<?= $class['class_id'] ?>&classname=<?= urlencode($class['class_name']) ?>"><span class="fa fa-university"></span> <?= $class['class_name'] ?></a>
        
      <?php
      }    
      }
      ?>

      </div>
  </div>
</div>
<?php
write_js_requires($cfg);
write_footer($cfg);
?>
