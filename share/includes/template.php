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

function write_js_requires($cfg) {
  echo $cfg['js-requires'];
}

/* Finish */
function write_missions($cfg) {
  /*
  $i = 0;
  foreach ($cfg['missions'] as $mission) {
      echo '<div class="mission"><div class="mission-symbol"></div><div class="mission-label">' . $mission['title'] . '</div></div>';
    $i++;
  }*/
}

// Loads the package configuration, and the required libraries.
function init() {
  $cfg = spyc_load_file("./app.yaml");
  $libs = spyc_load_file(ROOT . "apps/share/libraries.yaml");
  $cfg['aliases'] = spyc_load_file(ROOT . "apps/share/aliases.yaml");

  
  $cfg['css-requires'] = array();
  $cfg['js-requires'] = array();
  
  if ($cfg['requires'] !== NULL) {
    foreach ($cfg['requires'] as $req) {
      if (!$libs[$req]) {
        error_log("Could not find requirement " . $req);
        continue;
      } else {
        foreach ($libs[$req] as $file) {
          $file = DOCUMENT_ROOT . $file;
          if (preg_match('/.js$/', $file)) {
            $cfg['js-requires'][] = "<script type=\"text/javascript\" src=\"$file\"></script>";
          } elseif (preg_match('/.css$/', $file)) {
            $cfg['css-requires'][] = "<link rel=\"stylesheet\" href=\"$file\">";
          } else {
            error_log("Don't know how to interpret " . $file);
          };
        }
      }
    }
  }

  $cfg['css-requires'] = implode("\n", $cfg['css-requires']);
  $cfg['js-requires'] = implode("\n", $cfg['js-requires']);
  
  return($cfg);
}

?>
