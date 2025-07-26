<?php
// TCMIP PROXY API – Dùng để gọi từ frontend tránh CORS

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$url = "http://www.tcmip.cn:18121/Analysis/ForecastSyndrome/";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json"
]);

$response = curl_exec($ch);

if ($response === false) {
  echo json_encode([
    "error" => curl_error($ch)
  ]);
} else {
  echo $response;
}

curl_close($ch);
