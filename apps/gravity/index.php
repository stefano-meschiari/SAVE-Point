<?php
require($_SERVER['DOCUMENT_ROOT'] . '/../share/startup.php');
require('db.php');
db_ensure_logged_in();

$cfg = init();
write_header($cfg);
write_cfg_json($cfg);
write_mission_rules($cfg);
?>

<?php write_js_requires($cfg); ?>

<script>
 LOGGED_USER='<?= db_user(); ?>';
 APP_CFG.map = <?= json_encode(spyc_load_file("./map.yaml")); ?>;
</script>
<style>
 body, html {
   overflow:hidden;
 }
</style>

<div id="app-modal" class="full-size" style="display:none">
  Hello!
</div>


<div id="app" class="full-size">
  <div id="text-top" class="animated">
    Welcome!
  </div>
  
  
  <div id="canvas-container" class="full-size">
    
    <div id="info-top">
      <div id="info-table-container">
        <table cols="2">
          <tr>
            <td class="td-label">Distance</td>
            <td class="td-val" id="distance"></td>
          </tr>
          <tr>
            <td class="td-label">Speed</td>
            <td class="td-val" id="speed"></td>
          </tr>
          <tr>
            <td class="td-label">Time</td>
            <td class="td-val" id="time"></td>
          </tr>
          <tr>
            <td class="td-stars" colspan="2">
              <div id="stars">
              </div>
            </td>
          </tr>
        </table>
      </div>
      <div id="toolbars">
        <div class="toolbar in-front hidden" id="toolbar-zoom">
          Zoom: <strong><span id="zoom-value">100</span>%</strong>
          <span class="pull-right">
            <span class="btn-group">
              <button class="btn btn-sm btn-jrs in-front fa fa-plus" id="zoom-in"></button>
              <button class="btn btn-sm btn-jrs in-front fa fa-minus" id="zoom-out"></button>
            </span>
            <span class="fa fa-minus-circle btn-borderless" id="zoom-close"></span>
          </span>
        </div>
      </div>
      
    </div>
    <canvas id="canvas" resize keepalive="true" style="position:absolute"></canvas>
  </div>

  <div id="sidebar">
    <div class="sidebar-item">
      <div id="menu" class="btn-jrs-ico fa fa-bars"></div>
    </div>
    <div class="separator-center"></div>
    <div class="sidebar-item">
      <div id="sizes" class="btn-jrs-ico fa fa-arrows-alt"></div>
      <div class="sidebar-title">Toggle physical size</div>
    </div>
    <div class="sidebar-item">
      <div id="zoom" class="btn-jrs-ico fa fa-search"></div>
      <div class="sidebar-title">Zoom</div>
    </div>

    <div class="separator-center"></div>
    
    <div class="sidebar-item">
      <div id="missions" class="btn-jrs-ico fa fa-th-large"></div>
      <div class="sidebar-title">Mission list</div>
    </div>
    <div class="sidebar-item">
      <div id="reset" class="btn-jrs-ico fa fa-undo"></div>
      <div class="sidebar-title">Restart mission</div>
    </div>
    <div class="sidebar-item">
      <div id="dashboard" class="btn-jrs-ico fa fa-backward"></div>
      <div class="sidebar-title">Back to dashboard</div>
    </div>
    <div class="separator-center"></div>
    <div class="sidebar-item">
      <div id="help" class="btn-jrs-ico fa fa-question-circle"></div>
      <div class="sidebar-title">Help</div>
    </div>
    Debug:
    <button id="debug-get-stars" class="btn btn-sm btn-danger">get all stars</button>
    <button id="debug-reset-missions" class="btn btn-sm btn-danger">reset missions</button>

  </div>

  

  <div id="help-text" class="animated">
    <div id="help-body">
    </div>
  </div>


</div>

<div id="app-message" style="display:none">
  <div id="app-message-container">
    <div id="app-message-body">
      
    </div>
    <div id="app-message-close" class="btn-jrs-ico fa fa-close" onClick="$('#app-message').hide();"></div>
  </div>
</div>


<div id="app-menu" class="animated">
  <div id="app-menu-map-container">
    <div id="app-menu-world">
      <span id="app-menu-world-name">Hello!</span>
      <div class="float-right">
        <span class="icon-win-star color-accent"></span>&times;<span id="app-menu-stars-earned">20</span>
      </div>
    </div>
    <div id="app-menu-map">
      
    </div>
  </div>
  <div id="app-menu-text">
    <div id="app-menu-text-top">
      <button id="app-menu-start" class="btn btn-lg btn-jrs float-right">
        Play
      </button>

      <div id="app-menu-mission-title" class="title"></div>
      <div id="app-menu-mission-subtitle" class="subtitle"></div>
      <div id="app-menu-mission-stars"></div>
      <div class="clear"></div>
    </div>
    <div class="bubble-cont">
      <img src="img/boss.png" width="150" class="bubble-avatar">
      <div class="bubble">
        Hello!
      </div>
    </div>
    <div id="app-menu-start-container">
    </div>
  </div>
</div>

<script type="text/javascript" src="../share/js/init.js"></script>
<script type="text/javascript" src="js/app.js"></script>
<script type="text/javascript" src="js/templates.js"></script>
<script type="text/javascript" src="js/map.js"></script>
<script type="text/javascript" src="js/single-choice.js"></script>
<script type="text/javascript" src="js/speech.js"></script>
<script type="text/javascript" src="js/debug.js"></script>

<script type="text/paperscript" canvas="canvas" src="js/draw.js"></script>

<!-- Templates -->

<?php write_footer($cfg); ?>
