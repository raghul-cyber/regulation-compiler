import redis
r = redis.Redis(host='localhost', port=6379, db=0)
for key in r.keys('*'):
    try:
        t = r.type(key).decode('utf-8')
        if t == 'list':
            print(f"Queue {key.decode('utf-8')}: {r.llen(key)} messages")
    except Exception as e:
        print(f"Error {key}: {e}")
