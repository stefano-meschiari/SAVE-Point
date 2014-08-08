<?php
error_reporting(E_STRICT);

require_once('vendor/autoload.php');

// Renders the header using the given hash.
function write_header($cfg) {
  $m = new Mustache_Engine;
  echo $m->render(file_get_contents(ROOT . "share/skeleton/header.html"), $cfg);
};

// Renders the footer using the given hash.
function write_footer($cfg) {
  
  $m = new Mustache_Engine;
  echo $m->render(file_get_contents(ROOT . "share/skeleton/footer.html"), $cfg);
};

// Loads the package configuration, and the required libraries.
function init() {
  $cfg = spyc_load_file("./app.yaml");
  $libs = spyc_load_file(ROOT . "apps/share/libraries.yaml");
  $cfg['header-reqs'] = array();
  $cfg['footer-reqs'] = array();
  
  if ($cfg['requires'] !== NULL) {
    foreach ($cfg['requires'] as $req) {
      if (!$libs[$req]) {
        error_log("Could not find requirement " . $req);
        continue;
      } else {
        foreach ($libs[$req] as $file) {
          $file = DOCUMENT_ROOT . $file;
          if (preg_match('/.js$/', $file)) {
            $cfg['footer-reqs'][] = "<script type=\"text/javascript\" src=\"$file\"></script>";
          } elseif (preg_match('/.css$/', $file)) {
            $cfg['header-reqs'][] = "<link rel=\"stylesheet\" href=\"$file\">";
          } else {
            error_log("Don't know how to interpret " . $file);
          };
        }
      }
    }
  }

  $cfg['footer-reqs'] = implode("\n", $cfg['footer-reqs']);
  $cfg['header-reqs'] = implode("\n", $cfg['header-reqs']);
  
  return($cfg);
}



?>
