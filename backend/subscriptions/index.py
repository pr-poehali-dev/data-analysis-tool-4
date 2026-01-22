"""API для управления подписками и монетами"""
import json
import os
import psycopg2
from datetime import datetime, timedelta
from decimal import Decimal

def get_db_connection():
    """Создает подключение к базе данных"""
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def handler(event: dict, context) -> dict:
    """Обработчик запросов подписок и монет"""
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
    
    action = event.get('queryStringParameters', {}).get('action', '')
    
    if method == 'GET':
        user_id = event.get('queryStringParameters', {}).get('user_id')
        
        if action == 'status':
            return get_user_status(user_id)
        elif action == 'coins':
            return get_coins_balance(user_id)
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        if action == 'activate-trial':
            return activate_trial(body)
        elif action == 'purchase-subscription':
            return purchase_subscription(body)
        elif action == 'purchase-coins':
            return purchase_coins(body)
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid request'})
    }

def get_user_status(user_id: str) -> dict:
    """Получает полный статус пользователя"""
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id required'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Получаем данные пользователя
    cur.execute("SELECT status FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    
    if not user:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'})
        }
    
    user_status = user[0]
    
    # Проверяем активную подписку
    cur.execute(
        "SELECT type, end_date FROM subscriptions WHERE user_id = %s AND is_active = TRUE AND end_date > CURRENT_TIMESTAMP ORDER BY end_date DESC LIMIT 1",
        (user_id,)
    )
    subscription = cur.fetchone()
    
    # Получаем баланс монет
    cur.execute("SELECT balance FROM coins WHERE user_id = %s", (user_id,))
    coins_row = cur.fetchone()
    coins_balance = coins_row[0] if coins_row else 0
    
    cur.close()
    conn.close()
    
    has_subscription = subscription is not None
    subscription_type = subscription[0] if subscription else None
    subscription_end = subscription[1].isoformat() if subscription else None
    
    # Определяем что нужно пользователю
    needs_subscription = not has_subscription
    needs_coins = coins_balance < 200
    ready_for_payment = has_subscription and coins_balance >= 200
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'user_status': user_status,
            'has_subscription': has_subscription,
            'subscription_type': subscription_type,
            'subscription_end': subscription_end,
            'coins_balance': coins_balance,
            'needs_subscription': needs_subscription,
            'needs_coins': needs_coins,
            'ready_for_payment': ready_for_payment
        })
    }

def get_coins_balance(user_id: str) -> dict:
    """Получает баланс монет"""
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id required'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT balance, last_purchase_date, total_purchased FROM coins WHERE user_id = %s", (user_id,))
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not result:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'})
        }
    
    balance, last_purchase, total_purchased = result
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'balance': balance,
            'last_purchase_date': last_purchase.isoformat() if last_purchase else None,
            'total_purchased': total_purchased
        })
    }

def activate_trial(data: dict) -> dict:
    """Активирует пробный период 14 дней"""
    user_id = data.get('user_id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id required'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Проверяем, не активирован ли уже триал
    cur.execute("SELECT id FROM subscriptions WHERE user_id = %s AND type = 'trial'", (user_id,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Trial already used'})
        }
    
    # Создаем пробную подписку на 14 дней
    start_date = datetime.now()
    end_date = start_date + timedelta(days=14)
    
    cur.execute(
        "INSERT INTO subscriptions (user_id, type, start_date, end_date, is_active) VALUES (%s, 'trial', %s, %s, TRUE) RETURNING id",
        (user_id, start_date, end_date)
    )
    subscription_id = cur.fetchone()[0]
    
    # Обновляем статус пользователя
    cur.execute("UPDATE users SET status = 'TRIAL_ACTIVE' WHERE id = %s", (user_id,))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'subscription_id': subscription_id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        })
    }

def purchase_subscription(data: dict) -> dict:
    """Покупает годовую подписку (заглушка оплаты)"""
    user_id = data.get('user_id')
    payment_successful = data.get('payment_successful', True)  # Заглушка
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id required'})
        }
    
    if not payment_successful:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Payment failed'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Создаем годовую подписку
    start_date = datetime.now()
    end_date = start_date + timedelta(days=365)
    
    cur.execute(
        "INSERT INTO subscriptions (user_id, type, start_date, end_date, is_active, auto_renew) VALUES (%s, 'yearly', %s, %s, TRUE, TRUE) RETURNING id",
        (user_id, start_date, end_date)
    )
    subscription_id = cur.fetchone()[0]
    
    # Создаем транзакцию
    cur.execute(
        "INSERT INTO transactions (user_id, type, amount, description, status) VALUES (%s, 'subscription', 3000.00, 'Годовая подписка', 'completed')",
        (user_id,)
    )
    
    # Обновляем статус пользователя
    cur.execute("UPDATE users SET status = 'SUBSCRIPTION_ACTIVE' WHERE id = %s", (user_id,))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'subscription_id': subscription_id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        })
    }

def purchase_coins(data: dict) -> dict:
    """Покупает монеты (заглушка оплаты)"""
    user_id = data.get('user_id')
    package = data.get('package')  # 'basic', 'economy', 'profitable'
    payment_successful = data.get('payment_successful', True)  # Заглушка
    
    if not user_id or not package:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id and package required'})
        }
    
    # Пакеты монет
    packages = {
        'basic': {'coins': 200, 'price': 400},
        'economy': {'coins': 600, 'price': 1150},
        'profitable': {'coins': 1200, 'price': 2200}
    }
    
    if package not in packages:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid package'})
        }
    
    if not payment_successful:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Payment failed'})
        }
    
    pkg = packages[package]
    coins_amount = pkg['coins']
    price = pkg['price']
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Обновляем баланс монет
    cur.execute(
        "UPDATE coins SET balance = balance + %s, last_purchase_date = CURRENT_TIMESTAMP, total_purchased = total_purchased + %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s",
        (coins_amount, coins_amount, user_id)
    )
    
    # Создаем транзакцию
    cur.execute(
        "INSERT INTO transactions (user_id, type, amount, description, status) VALUES (%s, 'coin_purchase', %s, %s, 'completed')",
        (user_id, price, f'Покупка {coins_amount} монет')
    )
    
    # Получаем новый баланс
    cur.execute("SELECT balance FROM coins WHERE user_id = %s", (user_id,))
    new_balance = cur.fetchone()[0]
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'coins_purchased': coins_amount,
            'price_paid': price,
            'new_balance': new_balance
        })
    }
