<?php
require('../../share/startup.php');

$cfg = init();
write_header($cfg);
?>

<?php write_js_requires($cfg); ?>

<div id="sidebar">
  <div id="menu">&#9776;</div>
  <div id="missions">
    <div class="mission-symbol-completed"></div>
    
  </div>
</div>
<div id="canvas-container">
  <canvas id="canvas" resize></canvas>
</div>

<script type="text/paperscript" canvas="canvas" src="js/draw.js"></script>
<script type="text/javascript" src="js/ui.js"></script>

<?php write_footer($cfg); ?>
