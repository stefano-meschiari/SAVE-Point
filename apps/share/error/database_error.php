<?php
require($_SERVER['DOCUMENT_ROOT'] . '/../share/startup.php');

$cfg = init();
write_header($cfg);
?>

<div class="error">
The website is currently experiencing a database connection issue. Please retry again later.
</div>

<?php 
write_footer($cfg);
?>
