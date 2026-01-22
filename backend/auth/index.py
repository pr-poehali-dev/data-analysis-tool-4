"""API для регистрации и авторизации пользователей через SMS"""
import json
import os
import random
import psycopg2
from datetime import datetime, timedelta

# Хранилище временных SMS кодов (в продакшене использовать Redis)
SMS_CODES = {}

def get_db_connection():
    """Создает подключение к базе данных"""
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def handler(event: dict, context) -> dict:
    """Обработчик запросов авторизации"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    path = event.get('queryStringParameters', {}).get('action', '')
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        if path == 'send-code':
            return send_sms_code(body)
        elif path == 'verify-code':
            return verify_sms_code(body)
        elif path == 'complete-registration':
            return complete_registration(body)
    
    elif method == 'GET':
        if path == 'check-user':
            phone = event.get('queryStringParameters', {}).get('phone', '')
            return check_user_exists(phone)
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid request'})
    }

def send_sms_code(data: dict) -> dict:
    """Отправляет SMS код подтверждения"""
    phone = data.get('phone', '').strip()
    
    if not phone or len(phone) < 10:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid phone number'})
        }
    
    # Генерируем 4-значный код
    code = str(random.randint(1000, 9999))
    
    # Сохраняем код с истечением через 5 минут (в продакшене - Redis)
    SMS_CODES[phone] = {
        'code': code,
        'expires': datetime.now() + timedelta(minutes=5)
    }
    
    # В продакшене здесь отправка через SMS-провайдера
    # Для разработки просто возвращаем код (УДАЛИТЬ В ПРОДЕ!)
    print(f"SMS Code for {phone}: {code}")
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'message': 'SMS code sent',
            'debug_code': code  # УДАЛИТЬ В ПРОДАКШЕНЕ!
        })
    }

def verify_sms_code(data: dict) -> dict:
    """Проверяет SMS код и создает/авторизует пользователя"""
    phone = data.get('phone', '').strip()
    code = data.get('code', '').strip()
    
    if not phone or not code:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Phone and code required'})
        }
    
    # Проверяем код
    stored = SMS_CODES.get(phone)
    if not stored:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Code not found or expired'})
        }
    
    if stored['expires'] < datetime.now():
        del SMS_CODES[phone]
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Code expired'})
        }
    
    if stored['code'] != code:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid code'})
        }
    
    # Код верный, удаляем его
    del SMS_CODES[phone]
    
    # Проверяем существование пользователя
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id, phone, full_name, email, status FROM users WHERE phone = %s", (phone,))
    user = cur.fetchone()
    
    if user:
        # Существующий пользователь
        user_id, phone, full_name, email, status = user
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user_id': user_id,
                'phone': phone,
                'full_name': full_name,
                'email': email,
                'status': status,
                'is_new_user': False
            })
        }
    else:
        # Новый пользователь
        cur.execute(
            "INSERT INTO users (phone, status) VALUES (%s, 'NEW_USER') RETURNING id",
            (phone,)
        )
        user_id = cur.fetchone()[0]
        
        # Создаем запись монет с нулевым балансом
        cur.execute(
            "INSERT INTO coins (user_id, balance) VALUES (%s, 0)",
            (user_id,)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user_id': user_id,
                'phone': phone,
                'status': 'NEW_USER',
                'is_new_user': True
            })
        }

def complete_registration(data: dict) -> dict:
    """Завершает регистрацию пользователя (ФИО, Email)"""
    user_id = data.get('user_id')
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip()
    
    if not user_id or not full_name:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id and full_name required'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute(
        "UPDATE users SET full_name = %s, email = %s, status = 'ONBOARDING_COMPLETE', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
        (full_name, email if email else None, user_id)
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'message': 'Registration completed'
        })
    }

def check_user_exists(phone: str) -> dict:
    """Проверяет существование пользователя по телефону"""
    if not phone:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Phone required'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id, status FROM users WHERE phone = %s", (phone,))
    user = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if user:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'exists': True,
                'user_id': user[0],
                'status': user[1]
            })
        }
    else:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'exists': False})
        }
