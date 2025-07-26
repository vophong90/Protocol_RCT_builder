<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Nhận JSON đầu vào
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Kiểm tra dữ liệu đầu vào
if (!$data || !isset($data["synd_dict"])) {
  echo json_encode(["error" => "Thiếu dữ liệu đầu vào hợp lệ."]);
  exit;
}

// Chuẩn bị gọi API TCMIP
$tcmipUrl = "http://www.tcmip.cn:18121/Analysis/ForecastSyndrome/";
$ch = curl_init($tcmipUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json",
  "User-Agent: Mozilla/5.0 (compatible; TCMIPBot/1.0)"
]);

$response = curl_exec($ch);

// Bắt lỗi curl
if (curl_errno($ch)) {
  echo json_encode([
    "error" => "CURL failed",
    "message" => curl_error($ch)
  ]);
  curl_close($ch);
  exit;
}

curl_close($ch);

// Kiểm tra nếu server trả về HTML (không phải JSON)
if (stripos($response, "<!DOCTYPE") !== false) {
  echo json_encode([
    "error" => "TCMIP trả về HTML thay vì JSON",
    "raw" => $response
  ]);
  exit;
}

// Trả về phản hồi từ TCMIP
echo $response;
