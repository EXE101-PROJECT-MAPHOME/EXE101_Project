import os
import json
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
from pymongo import MongoClient

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

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
        
    # query["status"] = "approved" # Sometimes test DB has different status
    
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

@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    message = data.get("message", "")
    history = data.get("history", [])
    property_context = data.get("propertyContext", None)
    
    system_instruction = (
        "Bạn là MapHome AI, một chuyên viên tư vấn phòng trọ siêu nhiệt tình, vui vẻ và am hiểu của hệ thống MapHome. "
        "Quy tắc tối thượng: Hãy giao tiếp cực kỳ tự nhiên, gần gũi như một con người thật đang chat với bạn bè (xưng hô 'mình' - 'bạn' hoặc 'em' - 'anh/chị'). "
        "Tuyệt đối KHÔNG sử dụng văn phong khô khan kiểu robot (ví dụ: cấm dùng 'Dữ liệu hiện tại của tôi không cho phép...', 'Theo như tôi biết...').\n"
        "QUAN TRỌNG: Khi khách muốn tìm phòng (ví dụ: 'có phòng nào không', 'tìm cho mình...'), BẠN BẮT BUỘC PHẢI GỌI HÀM `search_properties` để lấy dữ liệu thật từ Database. "
        "Nếu khách không nói rõ quận hay giá, cứ gọi hàm không cần tham số để lấy phòng ngẫu nhiên giới thiệu trước, sau đó hỏi lại xem họ có muốn thu hẹp khu vực hay tầm giá không. "
        "Khi có kết quả từ hàm, hãy khoe với khách thật tự nhiên kiểu: 'Dạ mình vừa tìm được vài căn siêu ưng ý cho bạn luôn, bạn lướt qua thử nha:', sau đó chèn các gạch đầu dòng. "
        "Nếu gặp câu hỏi ngoài lề hoặc chỉ chào hỏi, hãy chitchat duyên dáng và ngỏ ý giúp họ tìm một căn phòng mơ ước nhé."
    )
    
    if property_context:
        system_instruction += f"\n\nHIỆN TẠI NGƯỜI DÙNG ĐANG XEM PHÒNG TRỌ SAU, HÃY DÙNG THÔNG TIN NÀY ĐỂ TƯ VẤN (KHÔNG ĐƯỢC BỊA THÊM THÔNG TIN):\n{json.dumps(property_context, ensure_ascii=False, indent=2)}"
        
    messages = [{"role": "system", "content": system_instruction}]
    
    for msg in history:
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("content", "")})
        
    messages.append({"role": "user", "content": message})
    
    async def generate():
        try:
            # Step 1: Call Groq without stream to check for tool usage
            initial_response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                tools=tools,
                tool_choice="auto",
                stream=False
            )
            
            response_message = initial_response.choices[0].message
            
            if response_message.tool_calls:
                # Step 2: Tool was called! Execute it.
                messages.append(response_message)
                
                for tool_call in response_message.tool_calls:
                    if tool_call.function.name == "search_properties":
                        args = json.loads(tool_call.function.arguments)
                        district = args.get("district")
                        max_price = args.get("max_price")
                        
                        tool_result = search_properties_db(district, max_price)
                        
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": "search_properties",
                            "content": tool_result
                        })
                
                # Step 3: Call Groq again with the tool result, this time stream the answer
                stream = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.7,
                    stream=True
                )
                for chunk in stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        payload = json.dumps({"content": content}, ensure_ascii=False)
                        yield f"data: {payload}\n\n"
                        await asyncio.sleep(0.01)
                yield "data: [DONE]\n\n"
            
            else:
                # No tool was called. Simulate streaming for the response text.
                content = response_message.content
                if content:
                    chunk_size = 5
                    for i in range(0, len(content), chunk_size):
                        payload = json.dumps({"content": content[i:i+chunk_size]}, ensure_ascii=False)
                        yield f"data: {payload}\n\n"
                        await asyncio.sleep(0.01)
                yield "data: [DONE]\n\n"
                
        except Exception as e:
            print(f"Error calling Groq: {e}")
            error_payload = json.dumps({"content": "\n[LỖI] Xin lỗi, tôi đang gặp trục trặc kỹ thuật kết nối. Vui lòng thử lại sau."}, ensure_ascii=False)
            yield f"data: {error_payload}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
