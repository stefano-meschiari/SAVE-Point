<?php
require('../../share/startup.php');

$cfg = init();
write_header($cfg);
?>

<?php write_js_requires($cfg); ?>

<div id="sidebar">
  <div id="menu">&#9776;</div>
  <div id="missions">
    <?php write_missions($cfg); ?>
  </div>
</div>
<div id="canvas-container">
  <canvas id="canvas" resize></canvas>
</div>
<div id="info-top">
  <table cols="2">
    <tr>
      <td class="td-label">Distance</td>
      <td class="td-val">123456</td>
    </tr>
    <tr>
      <td class="td-label">Speed</td>
      <td class="td-val">300,000 km/s</td>
    </tr>
  </table>  
</div>

<script type="text/paperscript" canvas="canvas" src="js/draw.js"></script>
<script type="text/javascript" src="js/ui.js"></script>

<?php write_footer($cfg); ?>
