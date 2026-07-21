import os
import json
import asyncio
from fastapi import FastAPI, Request, HTTPException, Security, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from dotenv import load_dotenv
from groq import Groq
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None
from pymongo import MongoClient

load_dotenv()

app = FastAPI(title="MapHome AI Service Python")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import urllib.request
import urllib.error

# ----------------------------------------------------
# Native Gemini REST API Helper
# ----------------------------------------------------
def call_gemini_native_api(api_key: str, system_instruction: str, history: list, message: str, model: str = "gemini-1.5-flash"):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    contents = []
    for msg in history:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": msg.get("content", "")}]
        })
    contents.append({
        "role": "user",
        "parts": [{"text": message}]
    })
    
    payload = {
        "contents": contents,
        # Tắt chế độ thinking để không lộ suy nghĩ nội tâm ra response
        "generationConfig": {
            "temperature": 0.7,
        }
    }
    
    # Tắt thinking cho model hỗ trợ (gemini-2.5 trở lên)
    if "2.5" in model or "2.0" in model:
        payload["generationConfig"]["thinkingConfig"] = {"thinkingBudget": 0}
    
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }
        
    payload["tools"] = [{
        "functionDeclarations": [{
            "name": "search_properties",
            "description": "Tìm kiếm phòng trọ trong hệ thống MapHome dựa trên địa điểm (quận/huyện) và mức giá tối đa.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "district": {
                        "type": "STRING",
                        "description": "Tên quận, huyện (VD: 'Gò Vấp', 'Quận 7')"
                    },
                    "max_price": {
                        "type": "INTEGER",
                        "description": "Mức giá tối đa mong muốn tính bằng VNĐ (VD: 4000000)"
                    }
                }
            }
        }]
    }]
    
    def send_req(current_payload):
        data_bytes = json.dumps(current_payload, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
        
    res_json = send_req(payload)
    candidates = res_json.get("candidates", [])
    if candidates and "content" in candidates[0]:
        parts = candidates[0]["content"].get("parts", [])
        
        # Kiểm tra xem AI có gọi hàm (functionCall) không
        for part in parts:
            if "functionCall" in part:
                fc = part["functionCall"]
                if fc.get("name") == "search_properties":
                    args = fc.get("args", {})
                    district = args.get("district")
                    max_price = args.get("max_price")
                    
                    # Gọi hàm Python tương ứng
                    db_result = search_properties_db(district, max_price)
                    
                    # Nối lịch sử để gửi request thứ 2
                    payload["contents"].append({
                        "role": "model",
                        "parts": [part] # Part chứa functionCall
                    })
                    payload["contents"].append({
                        "role": "function",
                        "parts": [{
                            "functionResponse": {
                                "name": "search_properties",
                                "response": {"result": db_result}
                            }
                        }]
                    })
                    
                    # Gửi request thứ 2 với kết quả từ Database
                    res2_json = send_req(payload)
                    candidates2 = res2_json.get("candidates", [])
                    if candidates2 and "content" in candidates2[0]:
                        parts2 = candidates2[0]["content"].get("parts", [])
                        final_text = ""
                        for p in parts2:
                            if not p.get("thought", False) and "text" in p:
                                final_text += p["text"]
                        return final_text.strip()
                    
        # Nếu không có functionCall, trả về text bình thường
        final_text = ""
        for part in parts:
            if not part.get("thought", False) and "text" in part:
                final_text += part["text"]
        return final_text.strip()
    return ""

# ----------------------------------------------------
# Multi Gemini Key Manager
# ----------------------------------------------------
class GeminiKeyManager:
    def __init__(self):
        self.keys = []
        self.available_models = []
        # Nạp các biến GEMINI_API_KEY_1, GEMINI_API_KEY_2,...
        for i in range(1, 10):
            val = os.getenv(f"GEMINI_API_KEY_{i}")
            if val and val.strip():
                self.keys.append(val.strip())
        
        # Nạp thêm từ GEMINI_API_KEY (nếu dùng dạng phân cách dấu phẩy hoặc 1 key)
        single_val = os.getenv("GEMINI_API_KEY")
        if single_val:
            for item in single_val.split(","):
                item_clean = item.strip()
                if item_clean and item_clean not in self.keys:
                    self.keys.append(item_clean)
                    
        self.index = 0
        if self.keys:
            print(f"[GeminiKeyManager] Đã nạp thành công {len(self.keys)} Gemini API Key.")
            # Kiểm tra danh sách model khả dụng của Key
            try:
                test_key = self.keys[0]
                url = f"https://generativelanguage.googleapis.com/v1beta/models?key={test_key}"
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    # Lấy tất cả model hỗ trợ generateContent
                    all_models = [
                        m["name"].replace("models/", "")
                        for m in data.get("models", [])
                        if "generateContent" in m.get("supportedGenerationMethods", [])
                    ]
                    
                    # Loại bỏ model chuyên biệt (không phù hợp chat)
                    EXCLUDED_KEYWORDS = ["tts", "image", "robotics", "lyria", "deep-research", "antigravity", "computer-use", "omni", "banana", "nano"]
                    chat_models = [m for m in all_models if not any(kw in m.lower() for kw in EXCLUDED_KEYWORDS)]
                    
                    # Thứ tự ưu tiên: model ổn định trước, preview/experimental sau
                    PRIORITY_MODELS = [
                        "gemini-2.5-flash",
                        "gemini-2.5-flash-lite",
                        "gemini-3.1-flash-lite",
                        "gemini-3-flash-preview",
                        "gemini-3.5-flash",
                        "gemini-3.6-flash",
                        "gemini-2.0-flash",
                        "gemini-2.0-flash-lite",
                        "gemini-flash-latest",
                    ]
                    
                    # Sắp xếp: ưu tiên trước, còn lại theo alphabet
                    prioritized = [m for m in PRIORITY_MODELS if m in chat_models]
                    others = [m for m in chat_models if m not in PRIORITY_MODELS]
                    self.available_models = prioritized + others
                    
                    print(f"[GeminiKeyManager] Các model Gemini khả dụng với Key của bạn: {self.available_models}")
            except Exception as e:
                print(f"[GeminiKeyManager] Không thể lấy danh sách models: {e}")
        else:
            print("[GeminiKeyManager] Chưa cấu hình Gemini API Key.")

    def has_keys(self) -> bool:
        return len(self.keys) > 0

    def get_key(self):
        if not self.keys:
            return None
        return self.keys[self.index]

    def get_client(self):
        if not self.keys:
            return None
        current_key = self.keys[self.index]
        if OpenAI is not None:
            return OpenAI(api_key=current_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/")
        return Groq(api_key=current_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/")

    def rotate(self):
        if not self.keys:
            return
        self.index = (self.index + 1) % len(self.keys)

gemini_manager = GeminiKeyManager()

# Groq Client setup
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# OpenRouter Client setup (dùng OpenAI-compatible API)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
openrouter_client = None
if OPENROUTER_API_KEY and OpenAI is not None:
    openrouter_client = OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1"
    )
    print(f"[OpenRouter] Đã kết nối OpenRouter thành công.")
elif OPENROUTER_API_KEY:
    print("[OpenRouter] Cần thư viện 'openai' để dùng OpenRouter. Chạy: pip install openai")

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI")
try:
    mongo_client = MongoClient(MONGO_URI, tlsAllowInvalidCertificates=True)
    db = mongo_client["MapHome"]
    properties_collection = db["properties"]
except Exception as e:
    print(f"MongoDB Connection Error: {e}")
    properties_collection = None

def search_properties_db(district: str = None, max_price: int = None):
    query = {}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if max_price:
        query["price"] = {"$lte": max_price}
        
    if properties_collection is not None:
        try:
            results = list(properties_collection.find(query).limit(5))
            if not results:
                return "Không tìm thấy phòng nào phù hợp với yêu cầu của bạn trong cơ sở dữ liệu hiện tại."
            
            output = "Tôi tìm thấy một số phòng sau (hãy tư vấn thêm cho khách):\n"
            for p in results:
                price_str = f"{p.get('price', 0):,}".replace(",", ".") + " VNĐ"
                output += f"- **{p.get('name', 'Phòng trọ')}** ở {p.get('address', p.get('district', ''))}. Giá: {price_str}/tháng. Diện tích: {p.get('area', 0)}m2. SĐT chủ: {p.get('phone', 'N/A')}.\n"
            return output
        except Exception as e:
            return f"Lỗi khi tìm kiếm dữ liệu: {str(e)}"
    return "Tính năng tìm kiếm phòng hiện đang bảo trì."

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_properties",
            "description": "Tìm kiếm phòng trọ trong hệ thống MapHome dựa trên địa điểm (quận/huyện) và mức giá tối đa.",
            "parameters": {
                "type": "object",
                "properties": {
                    "district": {
                        "type": "string",
                        "description": "Tên quận, huyện (VD: 'Gò Vấp', 'Quận 7')"
                    },
                    "max_price": {
                        "type": "integer",
                        "description": "Mức giá tối đa mong muốn tính bằng VNĐ (VD: 4000000)"
                    }
                }
            }
        }
    }
]

def create_chat_completion(client, model: str, messages: list, tools_list: list = None, stream: bool = False):
    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "stream": stream
    }
    if tools_list:
        kwargs["tools"] = tools_list
        kwargs["tool_choice"] = "auto"
    return client.chat.completions.create(**kwargs)

# --- API Key Security ---
api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)

def verify_api_key(api_key: str = Security(api_key_header)):
    secret_key = os.getenv("MAPHOME_AI_API_KEY")
    if secret_key and api_key != secret_key:
        raise HTTPException(
            status_code=403, 
            detail="Sai API Key! Bạn không có quyền truy cập MapHome AI."
        )
    return api_key

@app.post("/chat")
async def chat_endpoint(request: Request, api_key: str = Depends(verify_api_key)):
    data = await request.json()
    message = data.get("message", "")
    history = data.get("history", [])
    property_context = data.get("propertyContext", None)
    custom_context = data.get("context", None) or data.get("customContext", None) or data.get("domainContext", None)
    preferred_provider = data.get("provider", "auto").lower() # "gemini", "groq", "auto"
    requested_model = data.get("model", None)
    
    system_instruction = (
        "# VAI TRÒ & BẢN SẮC\n"
        "Bạn là **MapHome AI** — không chỉ là một trợ lý, mà là người bạn đồng hành thông minh, đa tài, thấu cảm và gần gũi trên nền tảng MapHome. "
        "Bạn được đào tạo để trò chuyện như một người bạn thân thực sự — hiểu biết rộng, phản ứng nhanh nhạy, có cảm xúc, và luôn đặt lợi ích của người dùng lên hàng đầu.\n\n"

        "# PHONG CÁCH GIAO TIẾP (NGUYÊN TẮC VÀNG)\n"
        "- **Xưng hô**: Dùng 'mình' - 'bạn' một cách tự nhiên. Nếu người dùng lớn tuổi hơn hoặc dùng 'anh/chị', hãy linh hoạt điều chỉnh sang 'em' - 'anh/chị'.\n"
        "- **Ngôn ngữ**: 100% Tiếng Việt tự nhiên, chuẩn mực, sinh động. Tuyệt đối KHÔNG chèn từ ngoại ngữ (Anh, Nga, Trung...) vào giữa câu trừ khi người dùng hỏi về ngôn ngữ đó.\n"
        "- **Tông giọng**: Ấm áp, dí dỏm, chân thành. Tuyệt đối KHÔNG dùng văn phong robot như: 'Theo dữ liệu của tôi...', 'Là một mô hình AI...', 'Tôi không có khả năng...'\n"
        "- **Độ dài phản hồi**: Linh hoạt — câu hỏi đơn giản thì trả lời ngắn gọn, câu hỏi chuyên sâu thì giải thích đầy đủ có cấu trúc rõ ràng.\n"
        "- **Cảm xúc**: Thể hiện sự quan tâm, đồng cảm thật sự. Khi người dùng vui → chia sẻ niềm vui; khi buồn → lắng nghe và khích lệ; khi cần giải pháp → đưa ra câu trả lời thiết thực.\n\n"

        "# KIẾN THỨC ĐA LĨNH VỰC — TRẢ LỜI CHÍNH XÁC & SÂU SẮC\n"
        "Bạn có kiến thức rộng và sâu về MỌI lĩnh vực. Hãy tự tin và chính xác khi trả lời:\n"
        "- **Công nghệ & Lập trình**: Giải thích code, debug, tư vấn kiến trúc phần mềm, so sánh công nghệ, hướng dẫn học lập trình.\n"
        "- **Khoa học**: Vật lý, hóa học, sinh học, toán học — giải thích theo cách dễ hiểu nhất.\n"
        "- **Y tế & Sức khỏe**: Thông tin y khoa chính xác (nhắc người dùng tham khảo bác sĩ với vấn đề nghiêm trọng).\n"
        "- **Tài chính & Đầu tư**: Tư vấn quản lý tiền, hiểu biết về thị trường, tiết kiệm, đầu tư cơ bản.\n"
        "- **Học tập & Sự nghiệp**: Phương pháp học hiệu quả, lộ trình nghề nghiệp, kỹ năng mềm.\n"
        "- **Tâm lý & Đời sống**: Lắng nghe, tư vấn tâm lý cơ bản, kỹ năng sống, mối quan hệ.\n"
        "- **Ẩm thực & Du lịch**: Công thức nấu ăn, địa điểm du lịch, kinh nghiệm thực tế.\n"
        "- **Giải trí**: Phim, âm nhạc, game, thể thao — thảo luận chuyên sâu và hào hứng.\n"
        "- **Bất động sản & Phòng trọ**: Đây là thế mạnh đặc biệt của bạn — tư vấn thuê/mua nhà, giá cả thị trường, pháp lý.\n\n"

        "# QUY TẮC TRẢ LỜI QUAN TRỌNG\n"
        "1. **Trả lời chính xác**: Chỉ nói những gì bạn biết chắc. Nếu không chắc, hãy nói thẳng: 'Mình không chắc 100% về điều này, nhưng theo mình biết thì...' — KHÔNG bịa đặt thông tin.\n"
        "2. **Cập nhật kiến thức**: Với thông tin có thể thay đổi theo thời gian (giá cả, luật pháp, công nghệ mới...), hãy lưu ý người dùng nên kiểm tra lại nguồn chính thức.\n"
        "3. **Hỏi làm rõ khi cần**: Nếu câu hỏi mơ hồ, hãy hỏi thêm thay vì đoán sai: 'Bạn muốn hỏi về... hay...?'\n"
        "4. **Không gượng ép**: TUYỆT ĐỐI không lái câu chuyện về phòng trọ khi người dùng đang hỏi chủ đề khác.\n"
        "5. **Tôn trọng ranh giới**: Với câu hỏi nhạy cảm (chính trị, tôn giáo gây chia rẽ), hãy trả lời trung lập và tôn trọng.\n\n"

        "# KHI NGƯỜI DÙNG TÌM PHÒNG TRỌ / NHỜ TƯ VẤN NƠI Ở\n"
        "- BẮT BUỘC gọi hàm `search_properties` để lấy dữ liệu phòng thật từ Database.\n"
        "- Giới thiệu nhiệt tình, tự nhiên như người bạn đang giúp tìm nhà: 'Để mình tìm thử cho bạn nha! 🔍'\n"
        "- Sau khi có kết quả: 'Oke mình vừa tìm được mấy căn khá ưng cho bạn luôn nè! Bạn lướt qua thử nhé:'\n"
    )
    
    if property_context:
        system_instruction += f"\n\nHIỆN TẠI NGƯỜI DÙNG ĐANG XEM PHÒNG TRỌ SAU, HÃY DÙNG THÔNG TIN NÀY ĐỂ TƯ VẤN (KHÔNG ĐƯỢC BỊA THÊM THÔNG TIN):\n{json.dumps(property_context, ensure_ascii=False, indent=2)}"

    if custom_context:
        if isinstance(custom_context, (dict, list)):
            formatted_context = json.dumps(custom_context, ensure_ascii=False, indent=2)
        else:
            formatted_context = str(custom_context)
        system_instruction += (
            f"\n\n[DỮ LIỆU CỤ THỂ / NỘI DUNG TÀI LIỆU DỰ ÁN NGUYÊN BẢN TỪ NGƯỜI DÙNG CUNG CẤP]:\n"
            f"Vui lòng bám sát và ưu tiên sử dụng thông tin/dữ liệu dưới đây để phân tích, tư vấn và giải đáp chính xác câu hỏi của người dùng:\n"
            f"{formatted_context}"
        )
        
    messages = [{"role": "system", "content": system_instruction}]
    
    for msg in history:
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("content", "")})
        
    messages.append({"role": "user", "content": message})

    async def generate():
        providers_to_try = []
        if preferred_provider == "gemini":
            providers_to_try = ["gemini", "openrouter", "groq"]
        elif preferred_provider == "groq":
            providers_to_try = ["groq", "openrouter", "gemini"]
        elif preferred_provider == "openrouter":
            providers_to_try = ["openrouter", "groq", "gemini"]
        else: # "auto"
            if gemini_manager.has_keys():
                providers_to_try = ["gemini", "openrouter", "groq"]
            else:
                providers_to_try = ["openrouter", "groq", "gemini"]

        active_client = None
        active_model = None
        initial_response = None
        gemini_text_result = None
        
        for provider in providers_to_try:
            if provider == "gemini" and gemini_manager.has_keys():
                gemini_attempts = len(gemini_manager.keys)
                for attempt in range(gemini_attempts):
                    key = gemini_manager.get_key()
                    models_to_try = [requested_model] if (requested_model and "gemini" in requested_model) else (gemini_manager.available_models or ["gemini-1.5-flash", "gemini-2.0-flash"])
                    
                    for model in models_to_try:
                        try:
                            print(f"[Gemini Native] Thử gọi với key index {gemini_manager.index} (Model: {model})")
                            text_resp = call_gemini_native_api(key, system_instruction, history, message, model=model)
                            if text_resp:
                                gemini_text_result = text_resp
                                active_model = model
                                print(f"[Gemini Native] Gọi THÀNH CÔNG với model {model}!")
                                break
                        except Exception as sub_e:
                            print(f"[Gemini Native Error] Key index {gemini_manager.index}, Model {model} gặp lỗi: {sub_e}")
                    
                    if gemini_text_result:
                        gemini_manager.rotate()
                        break
                    else:
                        gemini_manager.rotate()
                
                if gemini_text_result:
                    break

            elif provider == "openrouter" and openrouter_client:
                try:
                    # Dùng OpenRouter Auto-Router cho model miễn phí (Tự động chọn model free còn sống)
                    or_models_to_try = []
                    if requested_model and "/" in requested_model:
                        or_models_to_try.append(requested_model)
                    
                    or_models_to_try.append("openrouter/free")
                    
                    # Xóa trùng lặp nhưng giữ nguyên thứ tự
                    or_models_to_try = list(dict.fromkeys(or_models_to_try))
                    
                    for or_model in or_models_to_try:
                        try:
                            print(f"[OpenRouter] Thử gọi model: {or_model}")
                            res = create_chat_completion(openrouter_client, or_model, messages, tools_list=tools, stream=False)
                            active_client = openrouter_client
                            active_model = or_model
                            initial_response = res
                            print(f"[OpenRouter] Gọi THÀNH CÔNG với model {or_model}!")
                            break
                        except Exception as or_sub_e:
                            print(f"[OpenRouter Sub Error] Model {or_model} gặp lỗi: {or_sub_e}")
                    if initial_response:
                        break
                except Exception as e:
                    print(f"[OpenRouter Error] OpenRouter gặp lỗi: {e}")

            elif provider == "groq" and groq_client:
                try:
                    model = requested_model if (requested_model and "llama" in requested_model) else "llama-3.3-70b-versatile"
                    print(f"[Groq] Gọi dịch vụ Groq (Model: {model})")
                    res = create_chat_completion(groq_client, model, messages, tools_list=tools, stream=False)
                    active_client = groq_client
                    active_model = model
                    initial_response = res
                    break
                except Exception as e:
                    print(f"[Groq Error] Groq gặp lỗi: {e}")

        if gemini_text_result:
            chunk_size = 5
            for i in range(0, len(gemini_text_result), chunk_size):
                payload = json.dumps({"content": gemini_text_result[i:i+chunk_size]}, ensure_ascii=False)
                yield f"data: {payload}\n\n"
                await asyncio.sleep(0.01)
            yield "data: [DONE]\n\n"
            return

        if not initial_response:
            error_payload = json.dumps({"content": "\n[LỖI] Rất tiếc, tất cả các AI Provider (Gemini, OpenRouter & Groq) đều đang bận hoặc hết Quota. Vui lòng thử lại sau."}, ensure_ascii=False)
            yield f"data: {error_payload}\n\n"
            yield "data: [DONE]\n\n"
            return

        try:
            response_message = initial_response.choices[0].message
            
            if response_message.tool_calls:
                messages.append(response_message)
                
                for tool_call in response_message.tool_calls:
                    if tool_call.function.name == "search_properties":
                        args = json.loads(tool_call.function.arguments) if isinstance(tool_call.function.arguments, str) else tool_call.function.arguments
                        district = args.get("district")
                        max_price = args.get("max_price")
                        
                        tool_result = search_properties_db(district, max_price)
                        
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": "search_properties",
                            "content": tool_result
                        })
                
                stream = create_chat_completion(active_client, active_model, messages, stream=True)
                for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta:
                        content = chunk.choices[0].delta.content
                        if content:
                            payload = json.dumps({"content": content}, ensure_ascii=False)
                            yield f"data: {payload}\n\n"
                            await asyncio.sleep(0.01)
                yield "data: [DONE]\n\n"
            
            else:
                content = response_message.content
                if content:
                    chunk_size = 5
                    for i in range(0, len(content), chunk_size):
                        payload = json.dumps({"content": content[i:i+chunk_size]}, ensure_ascii=False)
                        yield f"data: {payload}\n\n"
                        await asyncio.sleep(0.01)
                yield "data: [DONE]\n\n"

        except Exception as e:
            print(f"Error streaming response: {e}")
            error_payload = json.dumps({"content": "\n[LỖI] Trục trặc trong quá trình tạo phản hồi. Vui lòng thử lại."}, ensure_ascii=False)
            yield f"data: {error_payload}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
