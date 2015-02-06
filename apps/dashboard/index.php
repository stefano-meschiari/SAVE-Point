<?php

require_once('../../share/startup.php');
require_once('db.php');
require_once('messages.php');

db_ensure_logged_in();

$cfg = init();
write_header($cfg);

?>
<?php write_js_requires($cfg); ?>
<div class="uk-container uk-container-center uk-margin-top uk-margin-large-bottom" id="container">
  
  <!--[if lt IE 7]>
  <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
  <![endif]-->

  <div id="content">
    <div id="save-brand">
      <div class="brand">
        <span class="heavy">SAVE</span><span class="sep">/</span><span class="light">Point</span>
        <div class="brand-acronym">
          Society for Astronomy Visualization and Education
        </div>
      </div>
    </div>

    <div id="app-screen">
      <div>
        <span class="font-l">Welcome, <?= db_user(); ?>!</span>
        <a href="/dashboard/usermgmt.php?action=logout" class="border pull-right">Log out</a>
      </div>
      <div class="clear"></div>
      <div class="separator">
      </div>

      <div class="app-dashboard">
        <div class="app-icon-container">
          <div class="app-icon app-icon-gravity" onClick="location.href='../gravity/'">
          </div>
          <div class="app-icon-label">
            Orbits
          </div>
          <div class="app-icon-subtitle">
            A game of gravity.
          </div>
        </div>
      </div>

      <?php
      if (db_user_is_instructor(db_user())) {   
        $classes = db_instructor_classes(db_user());
        foreach ($classes as $class) {
      ?>
        <div class="font-l">
          Instructor reports
        </div>
        <div class="app-dashboard">
          <a class="border" href="/dashboard/instructor_report.php?class=<?= $class['class_id'] ?>&classname=<?= urlencode($class['class_name']) ?>"><?= $class['class_name'] ?></a>
        </div>
      <?php
      }    
      }
      ?>
      
    </div>
  </div>
</div>
<?php
write_footer($cfg);
?>
