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
    <div id="info-help">
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
      <div id="missions" class="btn-jrs-ico fa fa-th-large"></div>
      <div class="sidebar-title">Mission list</div>
    </div>
    <div class="sidebar-item">
      <div id="reset" class="btn-jrs-ico fa fa-undo"></div>
      <div class="sidebar-title">Restart mission</div>
    </div>
    <div class="separator-center"></div>
    <div class="sidebar-item">
      <div id="dashboard" class="btn-jrs-ico fa fa-backward"></div>
      <div class="sidebar-title">Back to dashboard</div>
    </div>
    <div class="separator-center"></div>
    <div class="sidebar-item">
      <div id="help" class="btn-jrs-ico fa fa-question-circle"></div>
      <div class="sidebar-title">Help</div>
    </div>

  </div>

  

  <div id="help-text" class="animated">
    <div id="help-body">
    </div>
  </div>

</div>

<div id="app-menu" class="animated">
  <div id="app-menu-container">
    <div id="app-menu-message" class="title">Mission list</div>
    <div class="separator-center"></div>
    <div id="app-menu-stats">
      <div id="app-menu-stars">
      </div>
      <div id="app-menu-totals">
      </div>
    </div>
    <div class="separator-center clear"></div>
    <div id="app-menu-missions">
    </div>
  </div>
</div>

<script type="text/javascript" src="../share/js/init.js"></script>
<script type="text/javascript" src="js/app.js"></script>
<script type="text/javascript" src="js/debug.js"></script>
<script type="text/paperscript" canvas="canvas" src="js/draw.js"></script>

<?php write_footer($cfg); ?>
