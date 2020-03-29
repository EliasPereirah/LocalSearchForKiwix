<?php

if(isset($_GET['pattern']) && isset($_GET['content'])){
    $pattern = $_GET['pattern'];
    $pattern = str_replace([' ','  ','   ','    ','     '],'+',$pattern);
    $content = $_GET['content'];
    $url = "http://localhost:8000/search?content={$content}&pattern={$pattern}+";
    if(isset($_GET['start']) && isset($_GET['end'])){
        $start = $_GET['start'];
        $end = $_GET['end'];
        $url .="&start={$start}&end={$end}";
    }
    echo file_get_contents($url);
}else{
    echo "Define os paramentros";
}