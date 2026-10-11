<?php
declare(strict_types=1);
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH)??'/';
if($path==='/api.php'){require __DIR__.'/api.php';return true;}
if($path==='/runtime-config.js'){header('Content-Type: application/javascript');header('Cache-Control: no-store');echo "window.COVENANT_CONFIG = {backend:'php',api:'/api.php'};";return true;}
$root=realpath(dirname(__DIR__).'/dist');
$requested=rawurldecode($path==='/'?'/index.html':$path);
$file=realpath($root.$requested);
if(!$file||!str_starts_with($file,$root.DIRECTORY_SEPARATOR)||!is_file($file)){http_response_code(404);echo 'Page not found.';return true;}
$ext=strtolower(pathinfo($file,PATHINFO_EXTENSION));
$types=['html'=>'text/html; charset=utf-8','js'=>'application/javascript','mjs'=>'application/javascript','css'=>'text/css','svg'=>'image/svg+xml','webp'=>'image/webp','otf'=>'font/otf'];
if(!isset($types[$ext])){http_response_code(404);echo 'Not found.';return true;}
header('Content-Type: '.$types[$ext]);header('X-Content-Type-Options: nosniff');
readfile($file);return true;
