-- This script sets up the 'bills' table for the Credify application.
-- To use, run this script in your PostgreSQL database (e.g., via psql or a GUI tool).

-- Create the table
CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('Paid', 'Unpaid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Insert some sample data to get started
INSERT INTO bills (category, name, amount, due_date, status) VALUES
('Utilities', 'Electricity Bill', 1200.50, '2024-07-10', 'Unpaid'),
('Rent', 'Monthly Apartment Rent', 15000.00, '2024-07-01', 'Unpaid'),
('Internet', 'Broadband Connection', 999.00, '2024-06-25', 'Paid'),
('Subscriptions', 'Netflix Premium', 499.00, '2024-06-20', 'Paid');

-- Add a comment to confirm completion
COMMENT ON TABLE bills IS 'Table to store user bills for the Credify app.';

-- Table for Credit Cards
CREATE TABLE credit_cards (
    id SERIAL PRIMARY KEY,
    card_company VARCHAR(50) NOT NULL,
    card_number VARCHAR(19) NOT NULL,
    card_holder VARCHAR(255) NOT NULL,
    expiry_month VARCHAR(2) NOT NULL,
    expiry_year VARCHAR(2) NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data for Credit Cards
INSERT INTO credit_cards (id, card_company, card_number, card_holder, expiry_month, expiry_year, cvv) VALUES
(1, 'Visa', '4111 1111 1111 1111', 'John Doe', '12', '28', '123')
ON CONFLICT (id) DO NOTHING;

-- Table for Transactions
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES credit_cards(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL -- 'Credit' or 'Debit'
);

-- Sample Data for Transactions (2025)
INSERT INTO transactions (card_id, date, vendor, category, amount, type) VALUES
-- January 2025
(1, '2025-01-05', 'Amazon', 'Shopping', 150.00, 'Debit'),
(1, '2025-01-10', 'Starbucks', 'Food & Drink', 5.50, 'Debit'),
(1, '2025-01-15', 'Netflix', 'Entertainment', 15.99, 'Debit'),
(1, '2025-01-20', 'Gas Station', 'Transport', 45.00, 'Debit'),
(1, '2025-01-25', 'Salary', 'Income', 2000.00, 'Credit'),

-- February 2025
(1, '2025-02-03', 'Walmart', 'Groceries', 200.50, 'Debit'),
(1, '2025-02-08', 'Movie Theater', 'Entertainment', 30.00, 'Debit'),
(1, '2025-02-12', 'Uber', 'Transport', 25.00, 'Debit'),
(1, '2025-02-18', 'Restaurant', 'Food & Drink', 75.20, 'Debit'),
(1, '2025-02-25', 'Salary', 'Income', 2000.00, 'Credit'),

-- March 2025
(1, '2025-03-05', 'Best Buy', 'Electronics', 550.00, 'Debit'),
(1, '2025-03-11', 'Spotify', 'Entertainment', 9.99, 'Debit'),
(1, '2025-03-19', 'Local Cafe', 'Food & Drink', 12.75, 'Debit'),
(1, '2025-03-22', 'Amazon', 'Shopping', 89.90, 'Debit'),
(1, '2025-03-25', 'Salary', 'Income', 2000.00, 'Credit'),

-- April 2025
(1, '2025-04-02', 'H&M', 'Shopping', 120.00, 'Debit'),
(1, '2025-04-07', 'Gas Station', 'Transport', 50.00, 'Debit'),
(1, '2025-04-14', 'Apple Store', 'Electronics', 999.00, 'Debit'),
(1, '2025-04-21', 'Groceries Store', 'Groceries', 150.75, 'Debit'),
(1, '2025-04-25', 'Salary', 'Income', 2000.00, 'Credit');

-- More Sample Bills for 2025 to make insights more interesting
INSERT INTO bills (category, name, amount, due_date, status) VALUES
('Subscription', 'Amazon Prime', 1499.00, '2025-01-15', 'Paid'),
('Utilities', 'Electricity Bill', 1350.00, '2025-01-20', 'Paid'),
('Shopping', 'New Year Shopping', 4500.00, '2025-01-22', 'Paid'),
('Rent', 'Apartment Rent', 15000.00, '2025-02-01', 'Paid'),
('Internet', 'WiFi Bill', 999.00, '2025-02-25', 'Paid'),
('Subscription', 'Netflix', 499.00, '2025-03-05', 'Paid'),
('Utilities', 'Water Bill', 800.00, '2025-03-20', 'Unpaid'),
('Rent', 'Apartment Rent', 15000.00, '2025-04-01', 'Paid'),
('Other', 'Gym Membership', 2000.00, '2025-04-10', 'Unpaid');

-- Table for Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add a comment to confirm completion
COMMENT ON TABLE users IS 'Table to store user information for the Credify app.';

-- Drop the old username column and add first_name and last_name
ALTER TABLE users DROP COLUMN username;
ALTER TABLE users ADD COLUMN first_name VARCHAR(50);
ALTER TABLE users ADD COLUMN last_name VARCHAR(50);

-- Add columns for phone_number, profile_picture_url, notify_bills, notify_email, notify_sms, and two_factor_enabled to the users table
ALTER TABLE users
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN profile_picture_url TEXT,
ADD COLUMN notify_bills BOOLEAN DEFAULT TRUE,
ADD COLUMN notify_email BOOLEAN DEFAULT TRUE,
ADD COLUMN notify_sms BOOLEAN DEFAULT FALSE,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Remove the unnecessary columns from the users table
ALTER TABLE users
DROP COLUMN gender,
DROP COLUMN id_number,
DROP COLUMN tax_id,
DROP COLUMN tax_country,
DROP COLUMN address; 