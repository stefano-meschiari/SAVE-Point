<?php
require('../../share/startup.php');

$cfg = init();
write_header($cfg);
?>
<script type="text/paperscript" canvas="canvas">
 	// Create a Paper.js Path to draw a line into it:
	var path = new Path();
	// Give the stroke a color

 function onFrame(event) {
   var start = new Point(0, 0);
   path.remove();
   path = new Path();
	path.strokeColor = 'black';
   
	 path.moveTo(start);
	 path.lineTo(start + view.size);
 }

 onResize = onFrame;
</script>

<div class="container-fluid">
  <div class="row">
    <div class="col-xs-1">
      Hi
    </div>
    <div class="col-xs-11">
      <canvas id="canvas" style="width:100%; height:100%;">
      </canvas>
    </div>
  </div>
</div>

<?php
write_footer($cfg);
?>
