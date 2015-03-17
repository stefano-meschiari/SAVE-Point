<?php
require($_SERVER['DOCUMENT_ROOT'] . '/../share/startup.php');
require('db.php');

db_ensure_logged_in();
$user = db_user();
$logged_in = 'true';

$cfg = init();
write_header($cfg);
write_cfg_json($cfg);
write_mission_rules($cfg);
include('rss.php');

?>

<?php write_js_requires($cfg); ?>

<script>
 LOGGED_USER='<?= $user ?>';
 LOGGED_IN=<?= $logged_in ?>;
 IS_KIOSK=<?= (db_is_kiosk_user() ? 'true' : 'false') ?>;
</script>

<?php

?>
<div id="footer">
    <div id="footer-text"><span class="fa fa-hand-o-up"></span> Tap anywhere to start</div>
</div>
<div id="screen">
</div>
<script src="js/slides.js" type="text/javascript"></script>
<?php write_footer($cfg); ?>
