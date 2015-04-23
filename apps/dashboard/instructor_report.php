<?php

require_once('../../share/startup.php');
require_once('db.php');
require_once('messages.php');

db_ensure_logged_in();
$class_id = $_GET['class'];
$class_name = $_GET['class_name'];

if (!db_instructor_has_class(db_user(), $class_id)) {
    echo "You do not have permission to read this.";
    die();
}


function sortcmp2($row1, $row2) {
    return strcasecmp($row1[0], $row2[0]);      
}


$cfg = init();
$apps = array('orbits');
$headers_all = array();
$data_all = array();

foreach ($apps as $app) {
    $app_cfg = spyc_load_file("../" . $app . "/app.yaml");
    $app_missions = array();
    $nstars = 0;
    foreach ($app_cfg['missions'] as $mission) {
        
        if (!isset($mission['hidden']) && !$mission['hidden']) {
            $app_missions[$mission['name']] = $mission['title'];
            if (isset($mission['value']))
                $nstars += $mission['value'];
            else
                $nstars += 3;
        } 
    }
    $nmissions = count($app_missions);
    
    $head = array('Real name', 'Username', 'Stars earned', '% levels completed', '% stars earned');
    $head = array_merge($head, $app_missions);
    $data = db_instructor_report($app, $class_id);

    $avg = array(0, 0);
    $avg_counts = array(0, 0);
    
    $data_a = array();
    foreach ($data as $row) {
        $row_a = array();
        $row_a[0] = $row['real_name'];
        $row_a[1] = $row['username'];
        if (isset($row['earned_stars']))
            $row_a[2] = $row['earned_stars'];
        else
            $row_a[2] = 0;

        $game_data = json_decode($row['mission_data'], true);
        
        $mission_data = $game_data['missions'];
        $stars = 0;
        $missions = 0;
        $idx = 5;

        
        foreach (array_keys($app_missions) as $key) {
            foreach ($mission_data as $mission) {
                if (trim($mission['name']) == trim($key)) {

                    $row_a[] = $mission['stars'];
                    $stars += $mission['stars'];
                    
                    if ($mission['stars'] > 0) {
                        $missions++;
                        $avg[$idx] += $mission['stars'];
                        $avg_counts[$idx] ++;
                    }
                    $idx++;
                }
            }
        }
        $avg[2] += $stars; $avg_counts[2] ++;
        

        array_splice($row_a, 3, 0, sprintf("%.0f%% [%d/%d]", $missions/$nmissions * 100, $missions, $nmissions ));
        array_splice($row_a, 4, 0, sprintf("%.0f%% [%d/%d]", $stars/$nstars * 100, $stars, $nstars ));

        $avg[3] += $missions/$nmissions * 100; $avg_counts[3]++;
        $avg[4] += $stars/$nstars * 100; $avg_counts[4]++;
        
        $data_a[] = $row_a;
    }
    
    $avg_row = array('<i>- Averages -</i>', '');
    for ($i = 2; $i < count($avg); $i++) {
        $avg_row[] = sprintf("%.1f", $avg[$i]/$avg_counts[$i]);
        error_log(sprintf("%d %d\n", $avg[$i], $avg_counts[$i]));
    }
    $data_a[] = $avg_row;

    usort($data_a, 'sortcmp2');
    $data_all[$app] = $data_a;
    $headers_all[$app] = $head;
}

if ($_GET['out'] === 'csv') {
    header("Content-type: text/csv");
    header("Content-Disposition: attachment; filename=file.csv");
    header("Pragma: no-cache");
    header("Expires: 0");
    $out = fopen('php://output', 'w');
    $app = $_GET['app'];

    fputcsv($out, $headers_all[$app]);
    foreach ($data_all[$app] as $row)
        fputcsv($out, $row);
    fclose($out);
    die();
}


function write_table($header, $data) {
    echo '<table class="uk-table uk-table-striped ">';
    echo '<tr>';
    foreach ($header as $head) {
        echo "<th>" . $head . "</th>";
    }
    echo '</tr>';
    foreach ($data as $row) {
        echo '<tr>';
        foreach ($row as $cell)
            echo "<td>$cell</td>";
        echo '</tr>';
    }
    echo '</table>';
}


write_header($cfg);

?>
<?php write_js_requires($cfg); ?>
<style>
 html {
     background:white;
     color:black;
     user-select:all;
     -webkit-user-select:all;
 }
 .uk-table {
     white-space:nowrap;
     font-size:0.7rem;
 }
 a {
     color:blue;
 }
 .uk-button {
     color:black !important;
 }
 
</style>
<div class="uk-container uk-container-center uk-margin-top uk-margin-large-bottom" id="container">
    
    <div class="uk-clearfix">
        <a href="/dashboard/" class="uk-button primary-button uk-float-right">Back to dashboard</a>
    </div>
    <hr>
    <div class="instructor-title">
        <?= $_GET['classname'] ?>
    </div>
    <hr>
    <?php
    foreach ($apps as $app) {
        echo "<h3>App: $app ";
        echo '(<a href="/dashboard/instructor_report.php?class=' . $_GET['class'] . '&out=csv&app=' . $app . '">Download Excel</a>)</h3>';
        echo "<div class='uk-overflow-container'>";
        write_table($headers_all[$app], $data_all[$app]);
        echo "</div>";
    }
    
    ?>
    
    
    
</div>
</div>
<?php
write_footer($cfg);
?>
