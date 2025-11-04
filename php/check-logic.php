<?php
// /php/check-logic.php
// PHP 7.4+
// CORS + JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function json_response($arr, $code = 200) {
  http_response_code($code);
  echo json_encode($arr, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$prompt = isset($body['prompt']) ? trim($body['prompt']) : '';

if ($prompt === '') {
  json_response(['ok' => false, 'error' => 'Thiếu prompt'], 400);
}

// Lấy API key từ biến môi trường hoặc file cấu hình của bạn
$apiKey = getenv('OPENAI_API_KEY') ?: '';
$model  = getenv('OPENAI_MODEL') ?: 'gpt-4o-mini'; // tùy chỉnh nếu cần

if (!$apiKey) {
  // DEV MODE: không gọi ra ngoài, trả prompt để test luồng
  json_response([
    'ok' => true,
    'content' => "[DEV MODE] Chưa cấu hình OPENAI_API_KEY.\n\nPrompt nhận được:\n\n" . $prompt
  ]);
}

// Gọi OpenAI Chat Completions
$payload = [
  'model' => $model,
  'messages' => [
    ['role' => 'system', 'content' => 'Bạn là trợ lý nghiên cứu y khoa, chuyên kiểm tra logic đề cương RCT một cách súc tích, có gợi ý hành động.'],
    ['role' => 'user',   'content' => $prompt],
  ],
  'temperature' => 0.2,
  'max_tokens'  => 1200,
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey,
  ],
  CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
  CURLOPT_TIMEOUT => 120,
]);

$result = curl_exec($ch);
$errno  = curl_errno($ch);
$err    = curl_error($ch);
$code   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($errno) {
  json_response(['ok' => false, 'error' => 'CURL error: ' . $err], 502);
}

if ($code < 200 || $code >= 300) {
  json_response(['ok' => false, 'error' => 'OpenAI HTTP ' . $code . ': ' . $result], 502);
}

$decoded = json_decode($result, true);
$content = $decoded['choices'][0]['message']['content'] ?? '';

if (!$content) {
  json_response(['ok' => false, 'error' => 'Không nhận được nội dung phản hồi từ OpenAI'], 502);
}

json_response(['ok' => true, 'content' => $content]);
