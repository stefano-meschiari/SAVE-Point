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

function write_cfg_json($cfg) {  
  echo '<script type="text/javascript">';  
  echo "\nAPP_CFG = " . json_encode($cfg['app-cfg']) . ";\n";
  echo "\n</script>\n";
}

// TODO: This function needs to sanitize its input.
function write_mission_rules($cfg) {
  $missions = $cfg["missions"];
  $args = $cfg["args"];
  
  echo '<script type="text/javascript">';  
  echo "\nRULES_FN = {};\n";

  $idx = 0;
  
  foreach ($missions as $val) {
    echo "RULES_FN[$idx] = function() {\n";
    foreach ($args as $arg)
      echo "var $arg = app.get('$arg'); if ($arg === undefined) $arg = app.$arg(); \n";
    echo "return (" . $val['rule'] . ");";
    echo "\n};\n";
    echo "APP_CFG.missions[$idx].rule = $idx;\n";
    $idx++;
  }

  echo "\n</script>\n";
}

// Loads the package configuration, and the required libraries.
function init() {
  $cfg = spyc_load_file("./app.yaml");
  $libs = spyc_load_file(ROOT . "apps/share/libraries.yaml");

  $cfg['app-cfg'] = $cfg;
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
