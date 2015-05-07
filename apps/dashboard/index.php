<?php

require_once('../../share/startup.php');
require_once('db.php');
require_once('messages.php');

if ($_GET['s']) {
  $app = basename($_GET['s']);
  header("Location: /" + $app + "/");
  die();
}

db_check_special_user();

db_ensure_logged_in();

$cfg = init();
write_header($cfg);
include('canvas.html');
write_cfg_json($cfg);

?>
<?php if (db_is_kiosk_user()) { ?>
  <style>
   body, html {
     overflow:hidden;
   }
  </style>
<?php } ?>

<script>
 IS_KIOSK=<?= (db_is_kiosk_user() ? 'true' : 'false') ?>;
</script>

<div id="app-rotate">
  Hold your device in landscape orientation.
  <div>
    <img src="/share/img/ipad.png" class="uk-align-center">
  </div>
</div>
<div id="app-launching">
  Loading...
</div>

<div id="kiosk-credits" class="uk-modal">
  <div class="uk-modal-dialog">
    <div class="uk-modal-header uk-">
        <button class="uk-float-right uk-button uk-button-primary" id="kiosk-credits-close">
            Close
        </button>
        SAVE/Point
    </div>
    <h1>Help</h1>
    <hr>
    <table>
      <tr>
      <td>
        <span class="fa fa-th-large"></span>
      </td>
      <td>
        To start an application, <span class="word-tap"></span> on one of the icons.
      </td>
      </tr>
      <tr>
      <td>
        <span class="fa fa-hand-o-up"></span>
      </td>
      <td>
        To interact with the applications, use your <span class="word-finger"></span> to <span class="word-tap"></span> and drag on the items shown on the screen.
      </td>
      </tr>
      <tr>
      <td>
        <span class="fa fa-smile-o"></span>
      </td>
      <td>
        Enjoy yourself!
      </td>
      </tr>
    </table>
    </ul>
    <h1>Credits</h1>
    <hr>
    <strong>Dr. Stefano Meschiari</strong><br>
    Programming, game engine design & development, app & level design, kiosk design
    
    <hr>
    <strong>Dr. Randi Ludwig</strong><br>
    Learning objectives, educational testing & assessment, character animations, app & level design
    
    <hr> 
    <strong>Dr. Joel Green</strong><br>
    Musical tracks, story, app & level design
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
      <a class="uk-float-right uk-button primary-button uk-button-primary" href="http://save-point.io" target="_new"  style="margin-right:10px">
          <span class="fa fa-globe"></span> About <strong>SAVE</strong>/Point
      </a>
    <?php } ?>
    <div class="uk-float-right">
    </div>
  </div>

  <div id="content">
    <div class="uk-grid" data-uk-grid-margin>
      <div class="app-col uk-width-1-3">
        <a class="app-launcher" href="/gravitykit"><img src="img/gravitykit.png" width="192" class="uk-animation-hover uk-animation-scale app-icon">
        <div class="app-title">
          GravityKit <div class="uk-badge uk-badge-danger">BETA</div>
        </div>
        <div class="app-subtitle">
          See how gravity affects the motion of planets.
        </div>
        </a>
      </div>
      <div class="app-col uk-width-1-3">
        <a class="app-launcher" href="/orbits/"><img src="img/orbits.png" width="192" class="uk-animation-hover uk-animation-scale app-icon">
        <div class="app-title">
          Orbits <div class="uk-badge uk-badge-danger">BETA</div>
        </div>
        <div class="app-subtitle">
          Help an alien civilization design new planetary systems.
        </div>
        </a>
      </div>
      <div class="app-col uk-width-1-3">
        <a class="app-launcher" href="/spc/templates.html"><img src="img/spc.png" width="192" class="uk-animation-hover uk-animation-scale app-icon">        
        <div class="app-title">
          Super Planet Crash 
        </div>
        <div class="app-subtitle">
          Create and destroy your own Solar System.
        </div>
        </a>
      </div>
    </div>
    <div class="uk-grid" data-uk-grid-margin>
      <div class="app-col uk-width-1-3">
        <img src="img/systemic_live.png" width="192" class="uk-animation-hover uk-animation-scale app-icon"
             <?php if (db_is_kiosk_user()) { ?>
             onClick="alert('This app is not available yet for use on this kiosk.'); window.location.reload(true)">
             <?php } else { ?>
             onClick="location.href = 'http://stefanom.org/systemic-online/';">
             <?php } ?>
             
        <div class="app-title">
          Systemic Live
        </div>
        <div class="app-subtitle">
          Discover planets around other stars.
        </div>

      </div>
      <div class="app-col uk-width-1-3">
        <button id="help" class="uk-animation-hover uk-animation-scale">
          <span class="fa fa-question-circle"></span>
        </button>
        <div class="app-title">Help & Credits</div>
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
