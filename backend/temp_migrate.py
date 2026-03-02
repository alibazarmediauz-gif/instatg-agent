import sqlite3

def run():
    print("Connecting to demo.db...")
    conn = sqlite3.connect('demo.db')
    cursor = conn.cursor()

    try:
        cursor.execute('ALTER TABLE telegram_accounts ADD COLUMN telegram_user_id VARCHAR(100)')
        print("Column telegram_user_id added.")
    except Exception as e:
        print(f"Error adding telegram_user_id: {e}")

    try:
        cursor.execute('ALTER TABLE telegram_accounts ADD COLUMN access_token TEXT')
        print("Column access_token added.")
    except Exception as e:
        print(f"Error adding access_token: {e}")
        
    try:
        cursor.execute('ALTER TABLE telegram_accounts ADD COLUMN username VARCHAR(255)')
        print("Column username added.")
    except Exception as e:
        print(f"Error adding username: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    run()
