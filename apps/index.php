<?php
if (isset($_GET['s'])) {
  $app = basename($_GET['s']);
  header("Location: /" . $app . "/");
  die();
}

header("Location: /dashboard/");
?>
