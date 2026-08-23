import sys
import os
sys.path.append(os.path.abspath('.'))
from app.services.storage import StorageService
s = StorageService()
print(s.get_file_bytes("test"))
