import requests

url = "http://127.0.0.1:8080/api/v1/regulations/upload"
files = {'file': ('test.html', '<html><body>Test</body></html>', 'text/html')}
data = {'jurisdiction': 'US', 'name': 'Test Regulation'}

# without token, should return 401
r = requests.post(url, files=files, data=data)
print("Status:", r.status_code)
print("Response:", r.text)
