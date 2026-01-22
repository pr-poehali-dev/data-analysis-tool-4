-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'NEW_USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы подписок
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(20) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы монет
CREATE TABLE IF NOT EXISTS coins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    balance INTEGER DEFAULT 0,
    last_purchase_date TIMESTAMP,
    total_purchased INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы лицевых счетов
CREATE TABLE IF NOT EXISTS utility_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    provider VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    owner_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, account_number)
);

-- Создание таблицы платежей за ЖКУ
CREATE TABLE IF NOT EXISTS utility_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    account_id INTEGER REFERENCES utility_accounts(id),
    amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    coins_spent INTEGER DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    savings DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    transaction_id VARCHAR(255) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discount_used_month VARCHAR(7)
);

-- Создание таблицы всех транзакций
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    payment_provider VARCHAR(50),
    external_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы использования скидок по месяцам
CREATE TABLE IF NOT EXISTS discount_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    month VARCHAR(7) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    UNIQUE(user_id, month)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_coins_user ON coins(user_id);
CREATE INDEX IF NOT EXISTS idx_utility_accounts_user ON utility_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_utility_payments_user ON utility_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_utility_payments_status ON utility_payments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user_month ON discount_usage(user_id, month);