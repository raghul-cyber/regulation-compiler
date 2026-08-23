import httpx

r = httpx.get("http://localhost:8000/api/v1/policies")
print("Response:", r.status_code)
if r.status_code != 200:
    print(r.text)
