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

function read_json_body() {
  $raw = file_get_contents('php://input');
  $body = json_decode($raw, true);
  if (json_last_error() !== JSON_ERROR_NONE) {
    json_response(['ok' => false, 'error' => 'JSON không hợp lệ: '. json_last_error_msg()], 400);
  }
  return $body;
}

function sanitize_prompt($p) {
  $p = str_replace("\r\n", "\n", (string)$p);
  // Giữ \n, gom khoảng trắng
  $p = preg_replace('/[ \t\f\v\r]+/u', ' ', $p);
  $p = preg_replace('/[ ]*\n[ ]*/u', "\n", $p);
  // Loại ký tự điều khiển trừ \n
  $p = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $p);
  return trim($p);
}

$body   = read_json_body();
$prompt = isset($body['prompt']) ? sanitize_prompt($body['prompt']) : '';

if ($prompt === '') {
  json_response(['ok' => false, 'error' => 'Thiếu prompt'], 400);
}

// Cắt bớt prompt quá dài để tránh lỗi token (giữ ổn định hành vi)
$MAX_PROMPT = 16000; // ký tự
$truncated  = false;
if (mb_strlen($prompt, 'UTF-8') > $MAX_PROMPT) {
  $prompt    = mb_substr($prompt, 0, $MAX_PROMPT - 40, 'UTF-8') . " …[đã cắt bớt]";
  $truncated = true;
}

$apiKey = getenv('OPENAI_API_KEY') ?: '';
$model  = getenv('OPENAI_MODEL') ?: 'gpt-4o-mini';

if (!$apiKey) {
  // DEV MODE
  $content = "[DEV MODE] Chưa cấu hình OPENAI_API_KEY.\n";
  if ($truncated) $content .= "(Lưu ý: Prompt quá dài đã được cắt bớt)\n\n";
  $content .= "Prompt nhận được:\n\n" . $prompt;
  json_response(['ok' => true, 'content' => $content]);
}

// OpenAI Chat Completions
$payload = [
  'model' => $model,
  'messages' => [
    ['role' => 'system', 'content' => 'Bạn là trợ lý nghiên cứu y khoa, kiểm tra logic đề cương RCT súc tích, theo bullet, có gợi ý hành động.'],
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
  // Trả message rõ ràng hơn
  $snippet = is_string($result) ? mb_substr($result, 0, 400, 'UTF-8') : '';
  json_response(['ok' => false, 'error' => 'OpenAI HTTP ' . $code . ': ' . $snippet], 502);
}

$decoded = json_decode($result, true);
$content = $decoded['choices'][0]['message']['content'] ?? '';

if (!$content) {
  json_response(['ok' => false, 'error' => 'Không nhận được nội dung phản hồi từ OpenAI'], 502);
}

if ($truncated) {
  $content = "(Lưu ý: Prompt quá dài đã được cắt bớt ở server)\n\n" . $content;
}

json_response(['ok' => true, 'content' => $content]);
