<?php

function pp($t) {
    echo "<pre>\n";
    print_r($t);
    echo "\n</pre>\n";
}

function download($urls) {
    foreach ($urls as $url) {
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, 40);

        $data = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if (($data !== FALSE) && ($code != 404)) {
            error_log($url . " ok " . $code);
            return $data;
        } else {
            error_log($url . " no " . $code);
        }
    }
    return FALSE;
}

if (!file_exists("last_rss_update")) {
    $last_saved_diff = 4000;
} else {
    $last_saved_diff = strtotime("now") - (int) file_get_contents("last_rss_update");
}
file_put_contents("last_rss_update", strtotime("now"));

error_log($last_saved_diff);



// Redownload RSS feeds
if ($last_saved_diff > 3600 || !file_exists('slides.txt')) {
    $feed_list = $cfg['feeds'];

    foreach ($feed_list as $feed) {
        error_log($feed['url']);
        $content = str_replace("stsci:", "", download(array($feed['url'])));
        $xml = simplexml_load_string($content, null, LIBXML_NOCDATA);
        $json = json_encode($xml);
        $array = json_decode($json,TRUE);
        $items = $array['channel']['item'];

        
        foreach ($items as $item) {
            $slide = array();
            $slide['title'] = $item['title'];
            $imageURL = FALSE;
            if (isset($item['thumbnailImageURL']))
                $imageURL = $item['thumbnailImageURL'];

            if ($feed['transform'] === 'photojournal') {
                if (preg_match("/Object=(.+?)\"/", $item['description'], $matches) > 0) {

                    $slide['title'] = $matches[1] . " &mdash; " . preg_replace("/(PIA[0-9]+)/i", "", $slide['title']);
                }

                if (preg_match("/(PIA[0-9]+?).jpg/i", $item['description'], $matches) > 0) {
                    $imageURL = $feed['base'] . $matches[1] . "_modest.jpg";
                }

                error_log($imageURL);
            } else { 
                if ($imageURL === FALSE) {
                    $content = file_get_contents($item['link']);
                    if (preg_match('/img src="(.+?)"/i', $content, $matches) > 0) {
                        $imageURL = $matches[1];
                        if (isset($feed['base']))
                            $imageURL = $feed['base'] . $imageURL;
                        error_log($imageURL);
                    }
                }
            }
            
            if ($imageURL !== FALSE && ! (in_array(basename($imageURL), $cfg['blacklisted']))) {
                
                $url =  array(
                    str_replace("-thumb", "-large_web", $imageURL),
                    str_replace("a-thumb", "b-large_web", $imageURL),
                    str_replace("a-thumb", "c-large_web", $imageURL)
                );

                
                $data = download($url);
                
                if ($data !== FALSE) {
                    $dest = "assets/" . basename($imageURL);
                    $file = fopen($dest, "w+");
                    fputs($file, $data);
                    fclose($file);
                    $slide['img'] = $dest;
                } else {
                }
                curl_close($ch);                 
            }
            
            $slide['attrib'] = $feed['attrib'];
            if (isset($slide['img'])) {
                $slides[] = $slide;
            }
        }
    }

    file_put_contents('slides.txt', serialize($slides));
}
$slides = unserialize(file_get_contents('slides.txt'));
$slides = array_merge($cfg['slides'], $slides);

if (!isset($_GET['showall'])) {
    echo "<div class='slide-container'>";
    foreach ($slides as $idx => $slide) {
        echo "<div class='slide' id='slide" . $idx . "'>";
        echo "<img src='" . $slide['img'] . "' id='img" . $idx . "'>";
        echo "<div class='slide-title'>";
        echo "<div class='attrib'>" . $slide['attrib'] . "</div>";
        echo $slide['title'] . "</div>\n";
        echo "</div>";
    }
    echo "</div>";

} else {
    echo "<center>";
    foreach ($slides as $idx => $slide) {

        echo "<h1>" . $slide['title'] . "</h1>";
        echo "<h3>" . $slide['attrib'] . "</h3>";
        echo "<img src='" . $slide['img'] . "'>";
    }
    echo "</center>";
}
echo "<script>\nSLIDES = " . json_encode($slides) . ";\n</script>";
?>
