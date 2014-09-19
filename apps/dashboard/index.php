<?php

require_once('../../share/startup.php');
require_once('db.php');
require_once('messages.php');

db_ensure_logged_in();

$cfg = init();
write_header($cfg);

?>
<?php write_js_requires($cfg); ?>
<div id="app-screen">
  <div>
    <span class="font-l">Welcome, <?= db_user(); ?>!</span>
    <a href="usermgmt.php?action=logout" class="border pull-right">Log out</a>
  </div>
  <div class="clear">
  <div class="separator-center">
  </div>

  <div id="app-dashboard">
    <div class="app-icon-container">
      <div class="app-icon app-icon-gravity" onClick="location.href='../gravity/'">
      </div>
      <div class="app-icon-label">
        Gravity
      </div>
    </div>
  </div>
  <div class="separator-center">
  </div>
</div>

<?php
write_footer($cfg);
?>
