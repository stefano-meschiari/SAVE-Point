<?php
require('../../share/startup.php');

$cfg = init();
write_header($cfg);
?>

<?php write_js_requires($cfg); ?>

<div id="app">
  <div id="sidebar">
    <div id="menu" class="btn-jrs-ico fa fa-bars"></div>
    <div class="sidebar-section">Missions</div>
    
    <div id="missions">
      <div class="mission-completed">
        <div class="mission-symbol"></div>
        <div class="mission-label">Circular</div>
        <div class="clear"></div>
      </div>
      <div class="mission-completed">
        <div class="mission-symbol"></div>
        <div class="mission-label">Elliptical</div>
        <div class="clear"></div>        
      </div>
      <div class="mission-completed">
        <div class="mission-symbol"></div>
        <div class="mission-label">Mission #3</div>
        <div class="clear"></div>        
      </div>
      <div class="mission-active">
        <div class="mission-symbol"></div>
        <div class="mission-label">Mission #4
          </div>
          <div class="clear"></div>
      </div>
      <div class="mission">
        <div class="mission-symbol"></div>
        <div class="mission-label">Hello!</div>
        <div class="clear"></div>        
      </div>
    </div>
    
  </div>

  <div id="canvas-container">
    <canvas id="canvas" resize hidpi="false"></canvas>
  </div>
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
    </table>
    </div>
    <div id="info-help">
    </div>
  </div>
</div>

<div id="help-bottom" class="expanded">
  <div id="help-text">
  </div>
</div>

<div class="btn-jrs-ico fa fa-question-circle" id="help"></div>
</div>
<script type="text/paperscript" canvas="canvas" src="./js/draw.js"></script>
<script type="text/javascript" src="./js/ui.js"></script>

<?php write_footer($cfg); ?>
